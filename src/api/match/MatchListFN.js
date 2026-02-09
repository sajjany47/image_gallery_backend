import moment from "moment";
import Match from "./MatchModel.js";
import mongoose from "mongoose";
import MatchDetails from "./MatchDetailsModel.js";
import { CrexNext3DaysFixturesArray } from "./CrexNext3DaysFixturesArray.js";
import { CrexV2Details } from "./CrexV2Details.js";
import { SquadList } from "./SquadList.js";
import { FormatErrorMessage, NormalizeCrexUrl } from "../../utilis/utilis.js";
import logger from "./logger.js";

const CHUNK_SIZE = 10;

export const getMatchListFN = async () => {
  try {
    console.log("CRON HIT ✅", new Date().toISOString());

    // ---------------- DELETE OLD MATCHES ----------------
    const cutoffDate = moment().subtract(3, "days").format("YYYY-MM-DD");

    // 1️⃣ Old matches list
    const oldMatchList = await Match.find(
      { formatDate: { $lte: cutoffDate } },
      { _id: 1 },
    );

    const matchIds = oldMatchList.map((m) => m._id);
    // 2️⃣ MatchDetails delete
    if (matchIds.length > 0) {
      await MatchDetails.deleteMany({
        matchId: { $in: matchIds },
      });
    }

    await Match.deleteMany({
      formatDate: { $lte: cutoffDate },
    });

    // ---------------- FETCH FIXTURES ----------------
    const fixtures = await CrexNext3DaysFixturesArray();

    if (!fixtures?.length) {
      return "No fixtures found";
    }

    // ---------------- UPSERT MATCHES ----------------
    const bulkOps = fixtures.map((item) => {
      const url = NormalizeCrexUrl(item.url);

      return {
        updateOne: {
          filter: { url },
          update: {
            $set: { ...item, url },
            $setOnInsert: {
              formatDate: moment(item.matchDate, "ddd, DD MMM YYYY").format(
                "YYYY-MM-DD",
              ),
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      };
    });

    await Match.bulkWrite(bulkOps);

    // ---------------- FETCH UNPROCESSED MATCHES ----------------
    const dbMatches = await Match.find({ isDetailsFetched: false }).lean();

    if (!dbMatches.length) {
      return "No pending match details";
    }

    const successIds = [];

    // ---------------- PROCESS IN CHUNKS ----------------
    for (let i = 0; i < dbMatches.length; i += CHUNK_SIZE) {
      const chunk = dbMatches.slice(i, i + CHUNK_SIZE);

      const detailOps = [];

      for (const match of chunk) {
        try {
          const crexOverallStats = await CrexV2Details(match.url);

          if (!crexOverallStats) continue;

          const squads = (crexOverallStats.squads ?? []).map((team) => ({
            ...team,
            playingPlayers: (team.playingPlayers ?? []).map((p) => ({
              ...p,
              careerStats: {
                ...p.careerStats,
                bowling: (p.careerStats?.bowling ?? []).filter(
                  (b) => !b.format?.toLowerCase().includes("debut"),
                ),
              },
            })),
            benchPlayers: (team.benchPlayers ?? []).map((p) => ({
              ...p,
              careerStats: {
                ...p.careerStats,
                bowling: (p.careerStats?.bowling ?? []).filter(
                  (b) => !b.format?.toLowerCase().includes("debut"),
                ),
              },
            })),
          }));

          detailOps.push({
            updateOne: {
              filter: { matchId: match._id },
              update: {
                $set: {
                  matchId: match._id,
                  ...crexOverallStats,
                  squads,
                  updatedAt: new Date(),
                },
              },
              upsert: true,
            },
          });

          successIds.push(match._id);
        } catch (err) {
          console.error("DETAIL FETCH FAILED:", match.url);
        }
      }

      if (detailOps.length) {
        await MatchDetails.bulkWrite(detailOps);
      }
    }

    // ---------------- MARK FETCHED ----------------
    if (successIds.length) {
      await Match.updateMany(
        { _id: { $in: successIds } },
        {
          $set: {
            isDetailsFetched: true,
            detailsFetchedAt: new Date(),
          },
        },
      );
    }

    return {
      success: true,
      fixtures: fixtures.length,
      detailsFetched: successIds.length,
    };
  } catch (error) {
    console.error("CRON ERROR ❌", error);

    return { success: false, message: FormatErrorMessage(error) };
  }
};

/* =====================================================
   🕒 PLAYING XI / STATUS UPDATE CRON
===================================================== */

export const matchStatusUpdate = async () => {
  try {
    logger.info(`⏰ CRON HIT ${new Date().toISOString()}`);

    const cutoffDate = moment().subtract(1, "days").format("YYYY-MM-DD");

    const fixtures = await Match.find({
      formatDate: { $gte: cutoffDate },
      isPlayingPlayerFetched: false,
    });

    logger.info(`🟢 Fixtures found: ${fixtures.length}`);

    if (!fixtures.length) {
      return { success: true, message: "No fixtures found" };
    }

    const startedMatches = fixtures.filter((match) => {
      if (!match.matchDate || !match.startTime) return false;

      const start = moment(
        `${match.matchDate} ${match.startTime}`,
        "ddd, D MMM YYYY h:mm A",
      );

      return start.isSameOrBefore(moment());
    });

    logger.info(`🟢 Started matches: ${startedMatches.length}`);

    let processed = 0;

    for (let i = 0; i < startedMatches.length; i += CHUNK_SIZE) {
      const chunk = startedMatches.slice(i, i + CHUNK_SIZE);

      const bulkOps = [];

      for (const match of chunk) {
        try {
          await delay(5000); // anti-bot

          const matchDetails = await MatchDetails.findOne({
            matchId: new mongoose.Types.ObjectId(match._id),
          });

          if (!matchDetails?.squads?.length) continue;

          const latestSquad = await SquadList(match.url, matchDetails.squads);

          await MatchDetails.updateOne(
            { matchId: match._id },
            { $set: { squads: latestSquad } },
          );

          bulkOps.push({
            updateOne: {
              filter: { _id: match._id },
              update: {
                $set: {
                  isPlayingPlayerFetched: true,
                  playingXiFetchedAt: new Date(),
                },
              },
            },
          });

          processed++;
        } catch (err) {
          logger.error(`❌ Squad update failed`);
          logger.error(`🔗 ${match.url}`);
          logger.error(err.message);
        }
      }

      if (bulkOps.length) {
        await Match.bulkWrite(bulkOps);
      }
    }

    return {
      success: true,
      totalFound: fixtures.length,
      startedMatches: startedMatches.length,
      processed,
    };
  } catch (err) {
    logger.error("❌ CRON ERROR");
    logger.error(err.stack);
    return { success: false };
  }
};
