import cron from "node-cron";
import { getMatchListFN, matchStatusUpdate } from "./MatchListFN.js";
import logger from "./logger.js";

/* ===============================
   🕐 DAILY MATCH LIST (1 AM)
   =============================== */

// Every day at 02:00 AM

cron.schedule(
  "0 2 * * *",
  async () => {
    console.log("🌙 Match List CRON RUNNING (Daily 2 AM)");
    const result = await getMatchListFN();
    console.log("✅ CRON RESULT:", result);
  },
  {
    timezone: "Asia/Kolkata",
  },
);

/* ===============================
   ⏰ MATCH STATUS (EVERY 1 HOUR)
   =============================== */

// Every 2 hour
// Every 5 minutes
logger.info("🚀 Cron file loaded");

cron.schedule(
  "0 */2 * * *",
  async () => {
    logger.info("⏰ Match Status CRON STARTED (Every 2 hours)");

    try {
      const result = await matchStatusUpdate();
      logger.info(`🟢 CRON RESULT: ${JSON.stringify(result)}`);
    } catch (err) {
      logger.error(`🔴 CRON ERROR: ${err.message}`);
    }
  },
  {
    timezone: "Asia/Kolkata",
  },
);
