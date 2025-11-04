import { parseFormData, uploadFeedback } from './../middleware/upload.middleware';
import express, { Request, Response, NextFunction } from "express";
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
customerRoute.post("/delete-favourite", customerController.deleteFavouriteController);
customerRoute.get("/get-all-favourite", customerController.getAllFavouriteController);
customerRoute.get("/get-all-history", customerController.getAllHistoryController);
customerRoute.post("/add-cart", customerController.addCartController);
customerRoute.post("/get-product-in-cart", customerController.getProductInCartController);
customerRoute.post("/update-quantity-cart", customerController.updateQuantityCartController);
customerRoute.post("/delete-product-in-cart", customerController.deleteProductInCartController);
customerRoute.post("/get-product-detail-modal", customerController.getProductDetailModalController);
customerRoute.post("/update-variant-in-cart", customerController.updateVariantInCartController);
customerRoute.post("/get-address-and-fee", customerController.getAddressAndFeeController);
customerRoute.post("/get-voucher", customerController.getVoucherController);
customerRoute.post("/order-product", customerController.orderProductController);
customerRoute.post("/get-order-list", customerController.getOrderListController);
customerRoute.post("/get-order-detail", customerController.getOrderDetailController);
customerRoute.post("/confirm-receive-product", customerController.confirmReceiveProductController);
customerRoute.post("/return-product", customerController.returnProductController);
customerRoute.post("/send-feedback", parseFormData.any(), customerController.sendFeedbackController)
customerRoute.post("/get-feedback-order", customerController.getFeedbackOrderController);
customerRoute.post("/update-feedback", parseFormData.any(), customerController.updateFeedbackController);
customerRoute.post("/delete-feedback", customerController.deleteFeedbackController);

export default customerRoute;