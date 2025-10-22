import express from "express";
import * as appController from "../controllers/app.controller";

let appRoute = express.Router();

appRoute.get("/reload-page", appController.reloadPageController);
appRoute.post("/google-login", appController.googleLoginController);
appRoute.post("/normal-login", appController.normalLoginController);
appRoute.get("/logout", appController.logoutController);
appRoute.post("/check-email", appController.checkEmailController);
appRoute.post("/check-opt", appController.checkOtpController);
appRoute.post("/reset-password", appController.resetPasswordController);
appRoute.post("/verify-email", appController.verifyEmailController);
appRoute.post("/create-account", appController.createAccountController);
appRoute.get("/get-best-seller", appController.getBestSellerController);
appRoute.post("/get-product", appController.getProductController);
appRoute.post("/get-product-detail", appController.getProductDetailController);

export default appRoute;