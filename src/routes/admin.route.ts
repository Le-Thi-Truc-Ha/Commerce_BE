import express from "express";
import { checkLogin, checkPermission } from "../middleware/jwt";
import { uploadCloud } from "../middleware/upload.middleware";
import adminController from "../controllers/admin.controller";
import multer from "multer";

const adminRoute = express.Router();
const upload = multer();

adminRoute.use(checkLogin, checkPermission);

/** Dashboard */
adminRoute.get("/recent-orders", adminController.getRecentOrdesController);
adminRoute.get("/sales-data", adminController.getSalesDataController);
adminRoute.get("/categories-sale", adminController.getCategoriesSaleController);

/** Quản lý sản phẩm */
// Products
adminRoute.get("/products", adminController.getAllProductsController);
adminRoute.get("/product-id", adminController.getProductByIdController);
adminRoute.get("/product-categories", adminController.getProductCategoriesController);
adminRoute.post("/create-product", uploadCloud.array("files", 10), adminController.createProductController);
adminRoute.put("/update-product", uploadCloud.array("files", 10), adminController.updateProductController);
adminRoute.delete("/delete-product", adminController.deleteProductController);

// Variants
adminRoute.get("/product-detail", adminController.getProductDetailController);
adminRoute.get("/product-variants", adminController.getAllVariantsController);
adminRoute.get("/variant-id", adminController.getVariantByIdController);
adminRoute.post("/create-variant", upload.none(), adminController.createVariantController);
adminRoute.put("/update-variant", upload.none(), adminController.updateVariantController);
adminRoute.delete("/delete-variant", adminController.deleteVariantController);

export default adminRoute;