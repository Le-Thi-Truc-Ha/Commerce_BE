import express from "express";
import appController from "../controllers/app.controller";

let appRoute = express.Router();

appRoute.get("/reload-page", appController.reloadPageController);
appRoute.post("/google-login", appController.googleLoginController);
appRoute.post("/normal-login", appController.normalLoginController);
appRoute.get("/logout", appController.logoutController);
appRoute.post("/check-email", appController.checkEmailController);
appRoute.post("/check-opt", appController.checkOtpController);
appRoute.post("/reset-password", appController.resetPasswordController);

export default appRoute;