import express from "express";
import { tokenValidation } from "../middleware/auth.middleware.js";
import {
  PlanCreate,
  planList,
  PurchasePlan,
} from "../api/plan/plan.controller.js";
import { downloadHistory } from "../api/downloadHistory/downloadHistory.controller.js";

const PlanRoutes = express.Router();

PlanRoutes.route("/create").post(PlanCreate);
PlanRoutes.route("/purchase").post(tokenValidation, PurchasePlan);
PlanRoutes.route("/download").post(tokenValidation, downloadHistory);
PlanRoutes.route("/list").get(planList);

export default PlanRoutes;
