import express from "express";
import { checkLogin, checkPermission } from "../middleware/jwt";
import * as customerController from "../controllers/customer.controller";

let customerRoute = express.Router();

customerRoute.use(checkLogin, checkPermission);

customerRoute.get("/get-account-information", customerController.getAccountInformationController);
customerRoute.post("/save-information", customerController.saveAccountInformationController);
customerRoute.post("/save-password", customerController.savePasswordController);
customerRoute.post("/create-address", customerController.createAddressController);
customerRoute.get("/get-all-address", customerController.getAllAddressController);
customerRoute.get("/get-address", customerController.getAddressController);
customerRoute.post("/update-address", customerController.updateAddressController);
customerRoute.post("/delete-address", customerController.deleteAddressController);
customerRoute.post("/add-favourite", customerController.addFavouriteController);

export default customerRoute;