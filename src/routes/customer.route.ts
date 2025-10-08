import express from "express";
import { checkLogin, checkPermission } from "../middleware/jwt";
import customerController from "../controllers/customer.controller";

let customerRoute = express.Router();

customerRoute.use(checkLogin, checkPermission);

customerRoute.get("/get-account-information", customerController.getAccountInformationController);
customerRoute.post("/save-information", customerController.saveAccountInformationController);
customerRoute.post("/save-password", customerController.savePasswordController)

export default customerRoute;