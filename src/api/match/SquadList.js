import { getBrowser } from "./browser.js";

export const SquadList = async (url, squad = []) => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1920, height: 1080 });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    );

    page.setDefaultTimeout(60000);

    await page.goto(url, { waitUntil: "networkidle2" });

    // wait for playing XI section
    await page.waitForSelector(".playingxi", { timeout: 30000 });

    /* ================= SCRAPE LIVE PLAYING XI ================= */

    const latestSquad = await page.evaluate(() => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const output = [];

      const buttons = Array.from(
        document.querySelectorAll(".playingxi-button"),
      );

      const extractPlayers = () =>
        Array.from(document.querySelectorAll(".playingxi-card-row")).map(
          (row) => {
            const a = row.querySelector("a");

            return {
              name: a?.getAttribute("title") || "",
              role:
                row.querySelector(".bat-ball-type div")?.textContent?.trim() ||
                "",
              playerUrl: a?.getAttribute("href")
                ? "https://crex.com" + a.getAttribute("href")
                : null,
              playerImage:
                row.querySelector(".img-card img")?.getAttribute("src") || null,
            };
          },
        );

      return (async () => {
        for (let i = 0; i < buttons.length; i++) {
          buttons[i].click();
          await sleep(400);

          output.push({
            teamName: buttons[i].textContent?.trim() || "",
            players: extractPlayers(),
          });
        }
        return output;
      })();
    });

    if (!Array.isArray(latestSquad) || !latestSquad.length) {
      return squad;
    }

    /* ================= MERGE WITH DB SQUAD ================= */

    const preparedSquad = squad.map((team) => {
      const liveTeam = latestSquad.find((t) => t.teamName === team.teamName);

      if (!liveTeam) return team;

      const fullPlayerList = [
        ...(team.playingPlayers || []),
        ...(team.benchPlayers || []),
      ];

      const playingPlayers = fullPlayerList.filter((lp) =>
        liveTeam.players.some(
          (fp) =>
            (fp.playerUrl && fp.playerUrl === lp.playerUrl) ||
            fp.name === lp.name,
        ),
      );

      const benchPlayers = fullPlayerList.filter(
        (lp) =>
          !liveTeam.players.some(
            (fp) =>
              (fp.playerUrl && fp.playerUrl === lp.playerUrl) ||
              fp.name === lp.name,
          ),
      );

      return {
        ...team,
        playingPlayers,
        benchPlayers,
      };
    });

    return preparedSquad;
  } catch (err) {
    console.error("❌ SquadList error:", err.message);
    return squad;
  } finally {
    await page.close().catch(() => null);
    await browser.close().catch(() => null);
  }
};
