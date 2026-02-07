// import puppeteer from "puppeteer";

import { getBrowser } from "./browser.js";

/* ===============================
   Helpers
=============================== */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ===============================
   NEXT 3 DAYS FIXTURES
=============================== */

export const CrexNext3DaysFixturesArray = async () => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    page.setDefaultTimeout(60000);

    await page.goto("https://crex.com/fixtures/match-list", {
      waitUntil: "networkidle2",
    });

    await page.waitForSelector(".date-wise-matches-card", { timeout: 60000 });

    const matches = [];
    const seenMatchLinks = new Set();
    const orderedDays = [];

    const normalizeUrl = (href) =>
      href?.startsWith("http") ? href : `https://crex.com${href}`;

    const maxClicks = 15;
    let clicks = 0;

    while (orderedDays.length < 3 && clicks <= maxClicks) {
      const pageData = await page.evaluate(() => {
        const blocks = Array.from(
          document.querySelectorAll(".date-wise-matches-card > div"),
        ).filter((b) => b.querySelector(".date"));

        return blocks.map((block) => {
          const matchDate =
            block.querySelector(".date")?.textContent?.trim() || "";

          const matchEls = Array.from(
            block.querySelectorAll("li.match-card-container"),
          );

          const matches = matchEls.map((matchEl) => {
            const link =
              matchEl
                .querySelector("a.match-card-wrapper")
                ?.getAttribute("href") || null;

            const teamNames = Array.from(
              matchEl.querySelectorAll(".team-name"),
            ).map((x) => x.textContent?.trim() || "");

            const scores = Array.from(
              matchEl.querySelectorAll(".team-score"),
            ).map((x) => x.textContent?.trim() || "");

            const imgs = Array.from(matchEl.querySelectorAll(".team img")).map(
              (img) => img.getAttribute("src") || null,
            );

            const isLive = !!matchEl.querySelector(".liveTag");
            const isUpcoming = !!matchEl.querySelector(".not-started");

            let status;
            if (isLive) status = "LIVE";
            else if (isUpcoming) status = "UPCOMING";
            else status = "COMPLETED";

            const result =
              matchEl.querySelector(".result span")?.textContent?.trim() ||
              null;

            const startTime =
              matchEl.querySelector(".start-text")?.textContent?.trim() || null;

            const description =
              matchEl
                .querySelector(".time")
                ?.textContent?.replace(/\s+/g, " ")
                .trim() || null;

            return {
              matchDate,
              link,
              team1: teamNames[0] || "",
              team2: teamNames[1] || "",
              score1: scores[0] || null,
              score2: scores[1] || null,
              team1Flag: imgs[0] || null,
              team2Flag: imgs[1] || null,
              status,
              result,
              startTime,
              description,
            };
          });

          return { matchDate, matches };
        });
      });

      /* ================= STORE FIRST 3 DAYS ================= */

      for (const day of pageData) {
        if (!day.matchDate) continue;
        if (!orderedDays.includes(day.matchDate) && orderedDays.length < 3) {
          orderedDays.push(day.matchDate);
        }
      }

      /* ================= PICK MATCHES ================= */

      for (const day of pageData) {
        if (!orderedDays.includes(day.matchDate)) continue;

        for (const m of day.matches) {
          if (!m.link) continue;

          const fullUrl = normalizeUrl(m.link);
          if (seenMatchLinks.has(fullUrl)) continue;
          seenMatchLinks.add(fullUrl);

          const team1 = m.team1;
          const team2 = m.team2;
          const description = m.description;

          matches.push({
            matchId: m.link?.split("/")[3] || null,
            url: fullUrl,
            matchName: `${team1} vs ${team2}`,
            matchDescription: description,
            startTime: m.startTime,
            matchDate: m.matchDate,
            status: m.status,
            format: description?.includes("T20")
              ? "T20"
              : description?.includes("ODI")
                ? "ODI"
                : description?.includes("T10")
                  ? "T10"
                  : null,
            sport: "cricket",
            teams: [
              {
                teamName: team1,
                teamShortName: team1?.split(" ")[0] || team1,
                teamFlagUrl: m.team1Flag,
                cricketScore: m.score1,
              },
              {
                teamName: team2,
                teamShortName: team2?.split(" ")[0] || team2,
                teamFlagUrl: m.team2Flag,
                cricketScore: m.score2,
              },
            ],
            score: {
              score: [
                m.score1 ? { team: team1, run: m.score1 } : null,
                m.score2 ? { team: team2, run: m.score2 } : null,
              ].filter(Boolean),
              result: m.result || "",
            },
          });
        }
      }

      if (orderedDays.length >= 3) break;

      /* ================= NEXT BUTTON ================= */

      const nextBtn = await page.$(".next-button");
      if (!nextBtn) break;

      await nextBtn.click();
      await sleep(1500);

      await page.waitForSelector(".date-wise-matches-card", {
        timeout: 60000,
      });

      clicks++;
    }

    return matches;
  } catch (err) {
    console.error("❌ CrexNext3DaysFixturesArray error:", err?.message || err);
    return [];
  } finally {
    try {
      await page.close();
    } catch {}
    try {
      await browser.close();
    } catch {}
  }
};
