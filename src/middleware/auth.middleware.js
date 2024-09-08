import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

export const tokenValidation = async (req, res, next) => {
  try {
    const authToken = req.header("Authorization");

    if (!authToken) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Access Denied. No token provided." });
    }
    const token = authToken.split(" ")[1];
    const verified = jwt.verify(token, process.env.SECRET_KEY);
    req.user = verified;

    next();
  } catch (error) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Access Denied. Invalid or expired token." });
  }
};
