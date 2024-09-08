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
