import express from "express";
import jwt from "../middleware/jwt";

let adminRoute = express.Router();

adminRoute.use(jwt.checkLogin, jwt.checkPermission);

export default adminRoute;