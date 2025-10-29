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

/** Quản lý đơn hàng */
adminRoute.get("/status", adminController.getStatusController);
adminRoute.get("/orders", adminController.getAllOrdersController);
adminRoute.get("/bill", adminController.getBillController);

/** Quản lý khách hàng */
adminRoute.get("/customers", adminController.getAllCustomersController);
adminRoute.get("/customer-detail", adminController.getCustomerDetailController);
adminRoute.get("/customer-orders", adminController.getCustomerOrdersController);

/** Quản lý chương trình ưu đãi */
adminRoute.get("/promotions", adminController.getAllPromotionsController);
adminRoute.get("/promotion-products", adminController.getPromotionProductsController);
adminRoute.get("/promotion-id", adminController.getPromotionByIdController);
adminRoute.get("/promotion-products-category", adminController.getProductsByCategoryController);
adminRoute.post("/create-promotion", upload.none(), adminController.createPromotionController);
adminRoute.put("/update-promotion", upload.none(), adminController.updatePromotionController);
adminRoute.delete("/delete-promotion", adminController.deletePromotionController);

/** Quản lý mã khuyến mãi */
adminRoute.get("/vouchers", adminController.getAllVouchersController);
adminRoute.get("/voucher-detail", adminController.getVoucherDetailController);
adminRoute.get("/voucher-id", adminController.getVoucherByIdController);
adminRoute.get("/voucher-categories", adminController.getVoucherCategoriesController);
adminRoute.post("/create-voucher", upload.none(), adminController.createVoucherController);
adminRoute.put("/update-voucher", upload.none(), adminController.updateVoucherController);
adminRoute.delete("/delete-voucher", adminController.deleteVoucherController);

export default adminRoute;