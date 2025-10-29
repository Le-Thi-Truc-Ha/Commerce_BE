import express from "express";
import { checkLogin, checkPermission } from "../middleware/jwt";
import adminController from "../controllers/admin.controller";

const adminRoute = express.Router();

adminRoute.use(checkLogin, checkPermission);

/** Dashboard */
adminRoute.get("/recent-orders", adminController.getRecentOrdesController);
adminRoute.get("/sales-data", adminController.getSalesDataController);
adminRoute.get("/categories-sale", adminController.getCategoriesSaleController);

export default adminRoute;