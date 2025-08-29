import express from "express";
import { googleLoginController } from "../controllers/app.controller";

let appRoute = express.Router();

appRoute.post("/google-login", googleLoginController);

export default appRoute;