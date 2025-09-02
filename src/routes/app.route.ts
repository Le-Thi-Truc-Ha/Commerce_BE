import express from "express";
import { googleLoginController, logoutController, reloadPageController } from "../controllers/app.controller";

let appRoute = express.Router();

appRoute.get("/reload-page", reloadPageController);
appRoute.post("/google-login", googleLoginController);
appRoute.get("/logout", logoutController);

export default appRoute;