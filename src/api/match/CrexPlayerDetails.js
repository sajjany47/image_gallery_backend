import GetHtml from "./getHtml.js";

export const CrexPlayerDetails = async (url) => {
  const $ = await GetHtml(url);
  if (!$) return null;

  /* ================= PLAYER BASIC ================= */

  const first = $(".playerFName").first().text().trim();
  const last = $(".playerLName").first().text().trim();

  const player = {
    name: `${first} ${last}`.trim(),
    image: $("#playerWrap img").attr("src") || null,
    style: $(".btText span").first().text().trim() || null,
    rank: $(".playerTop")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean),
  };

  /* ================= RECENT FORM ================= */

  const readRecent = (type) => {
    return $(`#rfContainer\\ ${type} tr.formItems`)
      .map((_, row) => ({
        match: $(row).find(".itemSubtext").text().trim() || "",
        score: $(row).find(".itemText span").text().trim() || "",
        scorecardUrl: $(row).find(".itemText").attr("href")
          ? "https://crex.com" + $(row).find(".itemText").attr("href")
          : null,
      }))
      .get();
  };

  const recentForm = {
    batting: readRecent("Batting"),
    bowling: readRecent("Bowling"),
  };

  /* ================= CAREER STATS ================= */

  const careerSections = $("section.careerSection");

  /* ---- Batting ---- */
  const batting = careerSections
    .eq(0)
    .find("table tbody tr")
    .slice(1)
    .map((_, row) => {
      const td = $(row).find("td");
      return {
        format: td.eq(0).text().trim(),
        matches: td.eq(1).text().trim(),
        innings: td.eq(2).text().trim(),
        runs: td.eq(3).text().trim(),
        hundreds: td.eq(4).text().trim(),
        fifties: td.eq(5).text().trim(),
        highScore: td.eq(6).text().trim(),
        strikeRate: td.eq(7).text().trim(),
        average: td.eq(8).text().trim(),
        fours: td.eq(9).text().trim(),
        sixes: td.eq(10).text().trim(),
        ducks: td.eq(11).text().trim(),
        rank: td.eq(12).text().trim(),
      };
    })
    .get();

  /* ---- Bowling ---- */
  const bowling = careerSections
    .eq(1)
    .find("table tbody tr")
    .slice(1)
    .map((_, row) => {
      const td = $(row).find("td");
      return {
        format: td.eq(0).text().trim(),
        matches: td.eq(1).text().trim(),
        innings: td.eq(2).text().trim(),
        wickets: td.eq(3).text().trim(),
        economy: td.eq(4).text().trim(),
        average: td.eq(5).text().trim(),
        best: td.eq(6).text().trim(),
        threeWickets: td.eq(7).text().trim(),
        fiveWickets: td.eq(8).text().trim(),
        strikeRate: td.eq(9).text().trim(),
        maidens: td.eq(10).text().trim(),
        rank: td.eq(11).text().trim(),
      };
    })
    .get();

  return {
    player,
    stats: {
      recentForm,
      careerStats: {
        batting,
        bowling,
      },
    },
  };
};
