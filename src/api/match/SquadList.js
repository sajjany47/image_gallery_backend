import { getBrowser } from "../utils/browser.js";

export const SquadList = async (url, squad = []) => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1920, height: 1080 });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    );

    page.setDefaultTimeout(60000);

    // ❌ networkidle2 mat use karo
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // safer selector
    await page.waitForSelector(".playingxi-button", { timeout: 60000 });

    const latestSquad = await page.evaluate(async () => {
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

      for (let i = 0; i < buttons.length; i++) {
        buttons[i].click();
        await sleep(1200); // anti-bot delay

        output.push({
          teamName: buttons[i].textContent?.trim() || "",
          players: extractPlayers(),
        });
      }

      return output;
    });

    if (!Array.isArray(latestSquad) || !latestSquad.length) {
      return squad;
    }

    // merge with DB squad
    return squad.map((team) => {
      const liveTeam = latestSquad.find((t) => t.teamName === team.teamName);

      if (!liveTeam) return team;

      const fullPlayers = [
        ...(team.playingPlayers || []),
        ...(team.benchPlayers || []),
      ];

      return {
        ...team,
        playingPlayers: fullPlayers.filter((p) =>
          liveTeam.players.some(
            (lp) => lp.playerUrl === p.playerUrl || lp.name === p.name,
          ),
        ),
        benchPlayers: fullPlayers.filter(
          (p) =>
            !liveTeam.players.some(
              (lp) => lp.playerUrl === p.playerUrl || lp.name === p.name,
            ),
        ),
      };
    });
  } catch (err) {
    console.error("❌ SquadList error:", err.message);
    return squad;
  } finally {
    // ✅ only page close
    await page.close().catch(() => null);
  }
};
