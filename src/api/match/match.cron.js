import cron from "node-cron";
import { getMatchListFN, matchStatusUpdate } from "./MatchListFN.js";

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
// Every 30 minutes
cron.schedule(
  "*/30 * * * *",
  async () => {
    console.log("⏰ Match Status CRON STARTED (Every 30 minutes)");

    const result = await matchStatusUpdate();
    console.log("🟢 Match Status CRON RESULT:", result);
  },
  {
    timezone: "Asia/Kolkata",
  },
);

console.log("✅ CRON jobs initialized");
