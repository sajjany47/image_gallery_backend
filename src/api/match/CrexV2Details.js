// import puppeteer from "puppeteer";
import { getBrowser } from "./browser.js";
import { CrexPlayerDetails } from "./CrexPlayerDetails.js";

// Rate limiting helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const CrexV2Details = async (url) => {
  let browser;
  try {
    // browser = await puppeteer.launch({
    //   headless: true,
    //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
    // });
    const browser = await getBrowser();

    const page = await browser.newPage();
    page.setDefaultTimeout(60000);

    await page
      .goto(url, { waitUntil: "networkidle2", timeout: 60000 })
      .catch(() => null);

    // ✅ wait some safe selector
    await page.waitForSelector("body", { timeout: 15000 }).catch(() => null);

    /* ===============================
   🧑‍🤝‍🧑 SQUADS (BEFORE + AFTER TOSS)
=============================== */

    // Toss (null before toss)
    const toss = await page
      .$eval(".toss-wrap p", (el) => el.textContent?.trim())
      .catch(() => null);

    const isAfterToss = Boolean(toss);

    // wait team buttons
    await page.waitForSelector(".playingxi-button").catch(() => null);

    const squads = [];

    const teamCount = await page
      .$$eval(".playingxi-button", (btns) => btns.length)
      .catch(() => 0);

    // helper → extract currently visible players
    const extractPlayers = async () => {
      try {
        await page
          .waitForFunction(
            () => document.querySelectorAll(".playingxi-card-row").length > 0,
            { timeout: 15000 },
          )
          .catch(() => null);
      } catch {
        console.log("⚠️ Players not loaded, continuing...");
      }

      return page
        .$$eval(".playingxi-card-row", (rows) =>
          rows.map((row) => {
            const a = row.querySelector("a");

            return {
              name: a?.getAttribute("title") || "",
              shortName:
                row.querySelector(".p-name")?.textContent?.trim() || "",
              role:
                row.querySelector(".bat-ball-type div")?.textContent?.trim() ||
                "",
              isWK: row.textContent?.includes("(WK)") || false,
              playerUrl: a?.getAttribute("href")
                ? "https://crex.com" + a.getAttribute("href")
                : null,
              image:
                row.querySelector(".img-card img")?.getAttribute("src") || null,
            };
          }),
        )
        .catch(() => []);
    };

    for (let i = 0; i < teamCount; i++) {
      const teamName = await page
        .$$eval(
          ".playingxi-button",
          (btns, idx) => btns[idx]?.textContent?.trim(),
          i,
        )
        .catch(() => `Team ${i + 1}`);

      // click team
      await page
        .evaluate((idx) => {
          const btn = document.querySelectorAll(".playingxi-button")[idx];
          btn?.click();
        }, i)
        .catch(() => null);

      await delay(400);

      // expand bench AFTER toss (EVERY TEAM)
      if (isAfterToss) {
        await page
          .evaluate(() => {
            const arrow = document.querySelector("#bench-arrow");
            arrow?.scrollIntoView({ block: "center" });
            arrow?.click();
          })
          .catch(() => null);

        // wait until bench rows appear (>11)
        await page
          .waitForFunction(
            () => document.querySelectorAll(".playingxi-card-row").length > 0,
            { timeout: 5000 },
          )
          .catch(() => null);

        await delay(300);
      }

      const allPlayers = await extractPlayers();

      let playingPlayers = [];
      let benchPlayers = [];

      if (!isAfterToss) {
        // BEFORE toss → full squad
        benchPlayers = allPlayers;
      } else {
        // AFTER toss → split
        playingPlayers = allPlayers.slice(0, 11);
        benchPlayers = allPlayers.slice(11);
      }

      squads.push({
        teamName: teamName || "",
        toss,
        playingPlayers,
        benchPlayers,
      });
    }

    /* ===============================
       🧑‍🤝‍🧑 Team Form (Last 5 Matches )
    =============================== */

    await page.waitForSelector(".format-match").catch(() => null);

    const teamForm = await page
      .$$eval(".format-match", (blocks) =>
        blocks.map((block) => {
          const teamName =
            block.querySelector(".form-team-name")?.textContent?.trim() || "";

          const teamFlag =
            block.querySelector(".form-team-img")?.getAttribute("src") || null;

          const arrow = block.querySelector("img[id$='arrow']");
          const teamId = arrow?.getAttribute("id")?.replace("arrow", "") || "";

          const last5 = Array.from(block.querySelectorAll(".match span"))
            .map((el) => el.textContent?.trim())
            .filter(Boolean);

          return {
            teamId,
            teamName,
            teamFlag,
            last5,
          };
        }),
      )
      .catch(() => []);

    //Expand match details to get more data of team form
    const teamFormDetails = await page
      .$$eval(".format-match-exp", (sections) =>
        sections.map((section) => {
          const teamId = section.getAttribute("id") || "";

          const matches = Array.from(
            section.querySelectorAll(".team-form-card"),
          ).map((card) => {
            const teams = Array.from(
              card.querySelectorAll(".form-team-detail"),
            ).map((t) => ({
              name: t.querySelector(".team-name")?.textContent?.trim() || "",
              score: t.querySelector(".team-score")?.textContent?.trim() || "",
              overs: t.querySelector(".team-over")?.textContent?.trim() || "",
              flag: t.querySelector("img")?.getAttribute("src") || null,
            }));

            return {
              matchName:
                card.querySelector(".match-name")?.textContent?.trim() || "",
              series:
                card.querySelector(".series-name")?.textContent?.trim() || "",
              result:
                card
                  .querySelector(".win.match span, .loss.match span")
                  ?.textContent?.trim() || "",
              teams,
              matchUrl: card.getAttribute("href")
                ? "https://crex.com" + card.getAttribute("href")
                : null,
            };
          });

          return { teamId, matches };
        }),
      )
      .catch(() => []);

    const teamFormFinal = teamForm.map((team) => ({
      ...team,
      matches:
        teamFormDetails.find((t) => t.teamId === team.teamId)?.matches || [],
    }));

    /* ===============================
       🆚 HEAD TO HEAD
    =============================== */

    await page.waitForSelector(".team-header-card").catch(() => null);

    const h2h = await page
      .evaluate(() => {
        const header = document.querySelector(".team-header-card");
        if (!header) return null;

        const team1 = {
          name:
            header.querySelector(".team1 .team-name")?.textContent?.trim() ||
            "",
          logo: header.querySelector(".team1 img")?.getAttribute("src") || "",
          wins: Number(
            header.querySelector(".team1-wins")?.textContent?.trim() || 0,
          ),
        };

        const team2 = {
          name:
            header.querySelector(".team2 .team-name")?.textContent?.trim() ||
            "",
          logo: header.querySelector(".team2 img")?.getAttribute("src") || "",
          wins: Number(
            header.querySelector(".team2-wins")?.textContent?.trim() || 0,
          ),
        };

        const matches = Array.from(
          document.querySelectorAll(".global-match-card"),
        ).map((card) => {
          const teams = card.querySelectorAll(".team-name");
          const scores = card.querySelectorAll(".team-score");
          const overs = card.querySelectorAll(".team-over");

          return {
            matchUrl: card.getAttribute("href")
              ? "https://crex.com" + card.getAttribute("href")
              : null,
            team1: teams[0]?.textContent?.trim() || "",
            team1Score: scores[0]?.textContent?.trim() || "",
            team1Overs: overs[0]?.textContent?.trim() || "",
            team2: teams[1]?.textContent?.trim() || "",
            team2Score: scores[1]?.textContent?.trim() || "",
            team2Overs: overs[1]?.textContent?.trim() || "",
            result:
              card.querySelector(".match-dec-text")?.textContent?.trim() || "",
            series:
              card.querySelector(".series-name")?.textContent?.trim() || "",
          };
        });

        return {
          team1,
          team2,
          matches,
        };
      })
      .catch(() => null);

    /* ===============================
       📊 POINTS TABLE
    =============================== */

    // wait for Angular table render
    await page
      .waitForFunction(
        () => document.querySelectorAll("table#table tbody tr").length >= 2,
      )
      .catch(() => null);

    const pointsTable = await page
      .evaluate(() => {
        const rows = Array.from(
          document.querySelectorAll("table#table tbody tr"),
        );

        return rows.map((row) => {
          const tds = row.querySelectorAll("td");

          return {
            team: tds[0]?.textContent?.replace(/\s+/g, " ").trim() || "",
            logo: tds[0]?.querySelector("img")?.getAttribute("src") || null,
            played: Number(tds[1]?.textContent?.trim() || 0),
            wins: Number(tds[2]?.textContent?.trim() || 0),
            losses: Number(tds[3]?.textContent?.trim() || 0),
            nrr: tds[4]?.textContent?.trim() || "",
            points: Number(tds[5]?.textContent?.trim() || 0),
          };
        });
      })
      .catch(() => []);

    /* ===============================
       🆔 TEAM Comparison DETAILS
    =============================== */

    await page.waitForSelector(".team-header-card").catch(() => null);

    const teams = await page
      .evaluate(() => {
        const team1 = document.querySelector(".team1");
        const team2 = document.querySelector(".team2");

        return {
          team1: {
            name: team1?.querySelector(".team-name")?.textContent?.trim() || "",
            logo: team1?.querySelector("img")?.getAttribute("src") || null,
          },
          team2: {
            name: team2?.querySelector(".team-name")?.textContent?.trim() || "",
            logo: team2?.querySelector("img")?.getAttribute("src") || null,
          },
        };
      })
      .catch(() => ({
        team1: { name: "", logo: null },
        team2: { name: "", logo: null },
      }));

    /* ===============================
       🔁 HELPER → READ TABLE
    =============================== */

    const readComparisonTable = async () => {
      await page
        .waitForFunction(
          () =>
            document.querySelectorAll("table.colHeader tbody tr").length > 0,
        )
        .catch(() => null);

      return page
        .evaluate(() => {
          const rows = Array.from(
            document.querySelectorAll("table.colHeader tbody tr"),
          );

          return rows.map((row) => {
            const tds = row.querySelectorAll("td");
            return {
              team1: tds[0]?.textContent?.trim() || "",
              metric: tds[1]?.textContent?.trim() || "",
              team2: tds[2]?.textContent?.trim() || "",
            };
          });
        })
        .catch(() => []);
    };

    /* ===============================
       📊 OVERALL (DEFAULT)
    =============================== */

    const overall = await readComparisonTable();

    /* ===============================
       📍 ON VENUE (CLICK TOGGLE)
    =============================== */

    await page
      .evaluate(() => {
        const tabs = Array.from(document.querySelectorAll(".team-comp-type"));
        const venueTab = tabs.find((el) => el.textContent?.includes("Venue"));
        venueTab?.click();
      })
      .catch(() => null);

    // wait for Angular re-render
    await page
      .waitForFunction(
        () => {
          const rows = document.querySelectorAll("table.colHeader tbody tr");
          return rows.length > 0;
        },
        { timeout: 30000 },
      )
      .catch(() => null);

    const venue = await readComparisonTable();

    /* ===============================
       📍 WAIT FOR VENUE SECTION
    =============================== */

    await page.waitForSelector("#venue-details").catch(() => null);

    const venuedetails = await page
      .evaluate(() => {
        /* ===============================
         🏟 VENUE NAME
      =============================== */

        const name =
          document
            .querySelector("#venue-details .title-text")
            ?.textContent?.trim() || "";

        /* ===============================
         🌦 WEATHER
      =============================== */

        const weatherWrap = document.querySelector("app-weather-details");

        const weather = {
          temperature:
            weatherWrap?.querySelector(".weather-temp")?.textContent?.trim() ||
            "",
          condition:
            weatherWrap
              ?.querySelector(".weather-cloudy-text, .weather-cloudy-text-mweb")
              ?.textContent?.trim() || "",
          humidity:
            weatherWrap
              ?.querySelector(".humidity-text div:last-child")
              ?.textContent?.trim() || "",
          rainChance:
            weatherWrap
              ?.querySelectorAll(".weather-place-hum-text")[1]
              ?.textContent?.trim() || "",
        };

        /* ===============================
         📊 VENUE STATS
      =============================== */

        const stats = {
          matches:
            document.querySelector(".match-count")?.textContent?.trim() || "",
          winBatFirst:
            document
              .querySelector(".win-bat-first .match-win-per")
              ?.textContent?.trim() || "",
          winBowlFirst:
            document
              .querySelectorAll(".venue-per .match-win-per")[1]
              ?.textContent?.trim() || "",
          avg1stInns:
            document
              .querySelectorAll(".venue-avg-val")[0]
              ?.textContent?.trim() || "",
          avg2ndInns:
            document
              .querySelectorAll(".venue-avg-val")[1]
              ?.textContent?.trim() || "",
        };

        /* ===============================
         🏏 RECORDS
      =============================== */

        const records = {};

        document.querySelectorAll(".venue-table-head").forEach((head, idx) => {
          const row = head.parentElement;
          if (row && head.textContent) {
            records[head.textContent.trim()] = {
              vs:
                row
                  ?.querySelector(".venue-vs-team-text")
                  ?.textContent?.trim() || "",
              score:
                row?.querySelector(".venue-score")?.textContent?.trim() || "",
            };
          }
        });

        /* ===============================
         ⚡ PACE vs SPIN
      =============================== */

        const paceVsSpin = {
          paceWickets:
            document
              .querySelector(".pace-text")
              ?.nextElementSibling?.textContent?.trim() || "",
          spinWickets:
            document
              .querySelector(".wicket-count.red-color")
              ?.textContent?.trim() || "",
          pacePercent:
            document.querySelectorAll(".s-format")[0]?.textContent?.trim() ||
            "",
          spinPercent:
            document.querySelectorAll(".s-format")[1]?.textContent?.trim() ||
            "",
        };

        /* ===============================
         🕒 RECENT MATCHES
      =============================== */

        const recentMatches = Array.from(
          document.querySelectorAll(".global-match-card"),
        ).map((card) => {
          const teams = card.querySelectorAll(".team-name");
          const scores = card.querySelectorAll(".team-score");
          const overs = card.querySelectorAll(".team-over");

          return {
            team1: teams[0]?.textContent?.trim() || "",
            team1Score: scores[0]?.textContent?.trim() || "",
            team1Overs: overs[0]?.textContent?.trim() || "",
            team2: teams[1]?.textContent?.trim() || "",
            team2Score: scores[1]?.textContent?.trim() || "",
            team2Overs: overs[1]?.textContent?.trim() || "",
            result:
              card.querySelector(".match-dec-text")?.textContent?.trim() || "",
            series:
              card.querySelector(".series-name")?.textContent?.trim() || "",
            url: card.getAttribute("href")
              ? "https://crex.com" + card.getAttribute("href")
              : null,
          };
        });

        return {
          name,
          weather,
          stats,
          records,
          paceVsSpin,
          recentMatches,
        };
      })
      .catch(() => ({
        name: "",
        weather: {
          temperature: "",
          condition: "",
          humidity: "",
          rainChance: "",
        },
        stats: {
          matches: "",
          winBatFirst: "",
          winBowlFirst: "",
          avg1stInns: "",
          avg2ndInns: "",
        },
        records: {},
        paceVsSpin: {
          paceWickets: "",
          spinWickets: "",
          pacePercent: "",
          spinPercent: "",
        },
        recentMatches: [],
      }));

    await page.close();

    // Process player details with rate limiting
    const prepareData = [];

    for (const team of squads) {
      /* ================= ENRICH PLAYER ================= */

      const enrichPlayer = async (player) => {
        if (!player.playerUrl) {
          return {
            ...player,
            style: null,
            rank: null,
            recentForm: null,
            careerStats: null,
          };
        }

        try {
          const details = await CrexPlayerDetails(player.playerUrl).catch(
            () => null,
          );

          if (!details) throw new Error("Empty response");
          console.log(`fetch data ${player.name}`);
          return {
            ...player,
            style: details.player?.style || null,
            rank: details.player?.rank || null,
            recentForm: details.stats?.recentForm || null,
            careerStats: details.stats?.careerStats || null,
          };
        } catch (err) {
          console.error(`Failed ${player.name}`, err);

          return {
            ...player,
            style: null,
            rank: null,
            recentForm: null,
            careerStats: null,
          };
        }
      };

      /* ================= PLAYING XI ================= */

      const playingPlayers = await Promise.all(
        team.playingPlayers.map(enrichPlayer),
      );

      /* ================= BENCH ================= */

      const benchPlayers = await Promise.all(
        team.benchPlayers.map(enrichPlayer),
      );

      prepareData.push({
        teamName: team.teamName,
        toss: team.toss,
        playingPlayers,
        benchPlayers,
      });
    }

    return {
      squads: prepareData,
      teamForm: teamFormFinal,
      h2h,
      pointsTable,
      comparision: {
        teams,
        comparison: {
          overall,
          venue,
        },
      },
      venueDetails: venuedetails,
    };
  } catch (error) {
    console.error(`Error in CrexV2Details:`, error);
    // Return default structure with null/empty values instead of throwing
    return {
      squads: [],
      teamForm: [],
      h2h: null,
      pointsTable: [],
      comparision: {
        teams: {
          team1: { name: "", logo: null },
          team2: { name: "", logo: null },
        },
        comparison: {
          overall: [],
          venue: [],
        },
      },
      venueDetails: {
        name: "",
        weather: {
          temperature: "",
          condition: "",
          humidity: "",
          rainChance: "",
        },
        stats: {
          matches: "",
          winBatFirst: "",
          winBowlFirst: "",
          avg1stInns: "",
          avg2ndInns: "",
        },
        records: {},
        paceVsSpin: {
          paceWickets: "",
          spinWickets: "",
          pacePercent: "",
          spinPercent: "",
        },
        recentMatches: [],
      },
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => null);
    }
  }
};
