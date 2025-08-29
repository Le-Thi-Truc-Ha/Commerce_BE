import express from "express";
import { checkLogin, checkPermission } from "../middleware/jwt";

let adminRoute = express.Router();

adminRoute.use(checkLogin, checkPermission);

export default adminRoute;