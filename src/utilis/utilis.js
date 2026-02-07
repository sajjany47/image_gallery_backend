import jwt from "jsonwebtoken";

export const generateToken = (reqData) => {
  const data = {
    _id: reqData._id,
    username: reqData.username,
    name: reqData.name,
  };
  const token = jwt.sign(data, process.env.SECRET_KEY, {
    expiresIn: "1h",
    // expiresIn: "10s",
  });

  return token;
};

export const NormalizeCrexUrl = (url) => {
  return url
    .replace(/\/(live|scorecard)(\/)?$/i, "/info") // live or scorecard => info
    .replace(/\/info(\/)?$/i, "/info"); // ensure ending clean
};

export const FormatErrorMessage = (error) => {
  if (error.errors) {
    // Case 1: error.errors is an array
    if (Array.isArray(error.errors)) {
      return error.errors.join(", ") || "Validation error occurred";
    }

    // Case 2: error.errors is an object (common in Zod/Mongoose validation errors)
    if (typeof error.errors === "object") {
      return Object.values(error.errors)
        .map((err) => err?.message || String(err))
        .join(", ");
    }

    // Case 3: already a string
    if (typeof error.errors === "string") {
      return error.errors;
    }
  } else if (error.message) {
    return error.message;
  }

  return "An unknown error occurred";
};
