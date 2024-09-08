import { StatusCodes } from "http-status-codes";
import user from "../user/user.model.js";
import mongoose from "mongoose";
import plan from "./plan.model.js";
import { planSchema } from "./plan.schema.js";

export const PlanCreate = async (req, res) => {
  try {
    const validatedPlan = await planSchema.validate(req.body);

    if (validatedPlan) {
      const isValid = await plan.findOne({
        name: validatedPlan.name,
      });

      if (!isValid) {
        let planData = {
          name: validatedPlan.name,
          price: validatedPlan.price,

          features: validatedPlan.features,

          description: validatedPlan.description,
        };

        const createPlan = new plan(planData);

        const savePlan = await createPlan.save();

        res
          .status(StatusCodes.OK)
          .json({ message: "Plan created successfully", data: savePlan });
      } else {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ message: "Username already exists" });
      }
    }
  } catch (error) {
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: error,
    });
  }
};
export const PurchasePlan = async (req, res) => {
  try {
    const validUser = await user.findOne({
      _id: new mongoose.Types.ObjectId(req.user._id),
    });

    if (validUser) {
      const validPlan = await plan.findOne({
        _id: new mongoose.Types.ObjectId(req.body.planId),
      });
      if (validPlan) {
        const updateUserPlan = await user.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(req.user._id) },
          {
            $set: {
              subscription: new mongoose.Types.ObjectId(req.body.planId),
            },
          },
          { new: true }
        );
        const userDetails = await user.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(req.user._id),
            },
          },
          {
            $lookup: {
              from: "plans",
              localField: "subscription",
              foreignField: "_id",
              as: "plan",
            },
          },
          {
            $unwind: {
              path: "$plan",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              plan: "$plan.name",
              planId: "$plan._id",
              name: 1,
              username: 1,
              email: 1,
            },
          },
        ]);
        return res.status(StatusCodes.OK).json({
          message: "Plan details updated suucessfully",
          data: userDetails[0],
        });
      } else {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "Plan details not found!" });
      }
    } else {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found!" });
    }
  } catch (error) {
    res.status(StatusCodes.BAD_GATEWAY).json({ message: error.message });
  }
};

export const planList = async (req, res) => {
  try {
    const list = await plan.find({});

    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: list });
  } catch (error) {
    res.status(StatusCodes.BAD_GATEWAY).json({ message: error.message });
  }
};
