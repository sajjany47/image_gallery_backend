import mongoose, { Schema } from "mongoose";

const TeamSchema = new Schema(
  {
    teamName: { type: String, default: null },
    teamShortName: { type: String, default: null },
    teamFlagUrl: { type: String, default: null },
    cricketScore: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

const MatchSchema = new Schema(
  {
    url: { type: String, default: null }, // your json "url"

    matchName: { type: String, default: null },
    matchDescription: { type: String, default: null },

    startTime: { type: String, default: null }, // "6:40 AM" OR null
    matchDate: { type: String, default: null }, // "Wed, 21 Jan 2026"

    status: {
      type: String,
      default: null,
      enum: [
        "UPCOMING",
        "LIVE",
        "COMPLETED",
        "ABANDONED",
        "CANCELLED",
        "NO RESULT",
        null,
      ],
    },
    formatDate: { type: Date, default: null }, // "2026-01-21"
    format: { type: String, default: null }, // T20
    sport: { type: String, default: "cricket" },
    teams: { type: [TeamSchema], default: [] },
    isPlayingPlayerFetched: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    isDetailsFetched: { type: Boolean, default: false },
    matchResult: { type: String, default: null },
  },
  { timestamps: true },
);

const Match = mongoose.models.Match || mongoose.model("Match", MatchSchema);

export default Match;
