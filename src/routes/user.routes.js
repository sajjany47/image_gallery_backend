import express from "express";
import { login, SignUp } from "../api/user/user.controller.js";

const UserRoutes = express.Router();

UserRoutes.route("/register").post(SignUp);
UserRoutes.route("/login").post(login);

export default UserRoutes;
