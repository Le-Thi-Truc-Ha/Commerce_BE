import express from "express";
import { checkLogin, checkPermission } from "../middleware/jwt";

let customerRoute = express.Router();

customerRoute.use(checkLogin, checkPermission);

export default customerRoute;