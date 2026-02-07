import mongoose, { Schema } from "mongoose";

const MatchDetailsSchema = new Schema(
  {
    matchId: { type: Schema.Types.ObjectId, ref: "Match", required: true },
    squads: { type: Schema.Types.Mixed, default: null },
    teamForm: { type: Schema.Types.Mixed, default: null },
    h2h: { type: Schema.Types.Mixed, default: null },
    pointsTable: { type: Schema.Types.Mixed, default: null },
    comparision: { type: Schema.Types.Mixed, default: null },
    venueDetails: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

const MatchDetails =
  mongoose.models.MatchDetails ||
  mongoose.model("MatchDetails", MatchDetailsSchema);

export default MatchDetails;
