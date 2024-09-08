import moment from "moment";
import history from "./downloadHistory.model.js";
import user from "../user/user.model.js";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

export const downloadHistory = async (req, res) => {
  try {
    const date = moment(new Date()).format("YYYY-MM-DD");

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

    if (userDetails.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found!" });
    }

    const userData = userDetails[0];
    let preareReqData = {
      userId: new mongoose.Types.ObjectId(req.user._id),
      productId: new mongoose.Types.ObjectId(req.body.productId),
      date: date,
    };

    if (userData.plan !== "Gold") {
      const findHistory = await history.find({
        userId: preareReqData.userId,
        date: date,
      });

      if (findHistory.length > 9) {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ message: "Daily limit exceeded" });
      }
    }

    const insertData = new history(preareReqData);
    const saveHistory = await insertData.save();

    return res.status(StatusCodes.OK).json({
      message: "Image downloaded successfully",
      data: saveHistory,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_GATEWAY).json({ message: error.message });
  }
};
