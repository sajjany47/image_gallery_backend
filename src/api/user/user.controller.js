import { StatusCodes } from "http-status-codes";
import { generateToken } from "../../utilis/utilis.js";
import user from "./user.model.js";
import { userSchema } from "./user.schema.js";
import bcrypt from "bcrypt";

export const SignUp = async (req, res) => {
  try {
    const validatedUser = await userSchema.validate(req.body);

    if (validatedUser) {
      const isValid = await user.findOne({
        username: validatedUser.username,
      });

      if (isValid === null) {
        let userData = {
          name: validatedUser.name,
          username: validatedUser.username,
          email: validatedUser.email,
          password: await bcrypt.hash(validatedUser.password, 10),
        };

        const createUser = new user(userData);

        const saveUser = await createUser.save();

        if (saveUser) {
          const data = {
            _id: saveUser._id,
            username: saveUser.username,
            name: saveUser.name,
          };

          const token = generateToken(data);

          return res
            .header("Authorization", token)
            .status(StatusCodes.OK)
            .json({
              message: "Data fetched successfully",
              data: { ...data, token: token },
            });
        }

        // return res
        //   .status(StatusCodes.OK)
        //   .json({ message: "User created successfully", data: saveUser });
      } else {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ message: "Username already exists" });
      }
    }
  } catch (error) {
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: error.mesaage,
    });
  }
};

export const login = async (req, res) => {
  try {
    const reqData = req.body;

    // const validUser = await user.findOne({ username: reqData.username });
    const userDetails = await user.aggregate([
      {
        $match: {
          username: reqData.username,
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
    ]);
    if (userDetails.length > 0) {
      const validUser = userDetails[0];
      const verifyPassword = await bcrypt.compare(
        reqData.password,
        validUser.password
      );
      if (verifyPassword) {
        const data = {
          _id: validUser._id,
          username: validUser.username,
          name: validUser.name,
        };
        const token = generateToken(data);

        return res
          .header("Authorization", token)
          .status(StatusCodes.OK)
          .json({
            message: "Data fetched successfully",
            data: {
              plan: validUser.plan.name,
              planId: validUser.plan._id,
              name: validUser.name,
              username: validUser.username,
              email: validUser.email,
              token: token,
            },
          });
      } else {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "Invalid password" });
      }
    } else {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found!" });
    }
  } catch (error) {
    return res.status(StatusCodes.BAD_GATEWAY).json({
      mesaage: error.mesaage,
      // details: error.message,
    });
  }
};
