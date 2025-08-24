import express from "express";
import jwt from "../middleware/jwt";

let customerRoute = express.Router();

customerRoute.use(jwt.checkLogin, jwt.checkPermission);

export default customerRoute;