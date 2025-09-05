import express from "express";
import { checkEmailController, googleLoginController, logoutController, normalLoginController, reloadPageController } from "../controllers/app.controller";

let appRoute = express.Router();

appRoute.get("/reload-page", reloadPageController);
appRoute.post("/google-login", googleLoginController);
appRoute.post("/normal-login", normalLoginController);
appRoute.get("/logout", logoutController);
appRoute.post("/check-email", checkEmailController);

export default appRoute;