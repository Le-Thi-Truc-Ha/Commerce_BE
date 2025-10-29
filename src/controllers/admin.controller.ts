import { Request, Response } from "express";
import { ReturnData } from "../interfaces/admin.interface";
import adminService from "../services/admin.service";

/** Dashboard */
const getRecentOrdesController = async (_: Request, res: Response): Promise<any> => {
    try {
        const result: ReturnData = await adminService.getRecentOrders();
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi lấy danh sách đơn hàng gần đây!",
            code: -1,
            data: false
        });
    }
};

const getSalesDataController = async (_: Request, res: Response): Promise<any> => {
    try {
        const result: ReturnData = await adminService.getSalesData();
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi lấy doanh thu bán hàng!",
            code: -1,
            data: false
        });
    }
};

const getCategoriesSaleController = async (_: Request, res: Response): Promise<any> => {
    try {
        const result: ReturnData = await adminService.getCategoriesSale();
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi lấy doanh thu bán hàng theo danh mục!",
            code: -1,
            data: false
        });
    }
};

/** Quản lý sản phẩm */
// Products
const getAllProductsController = async (req: Request, res: Response): Promise<any> => {
    try {
        const pageNum = Number(req.query.page) || 1;
        const limitNum = Number(req.query.limit) || 10;
        const search = String(req.query.search || "");
        const category = req.query.category ? String(req.query.category) : undefined;
        const price = req.query.price ? String(req.query.price) : undefined;

        const result: ReturnData = await adminService.getAllProducts(pageNum, limitNum, search, category, price);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi lấy danh sách sản phẩm!",
            code: -1,
            data: false
        });
    }
};

const getProductByIdController = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.query.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                message: "ID sản phẩm không hợp lệ!",
                code: 2,
                data: false
            });
        }

        const result: ReturnData = await adminService.getProductById(id);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi lấy thông tin sản phẩm!",
            code: -1,
            data: false
        });
    }
};

const getProductCategoriesController = async (_: Request, res: Response): Promise<any> => {
    try {
        const result: ReturnData = await adminService.getProductCategories();
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server lấy danh sách danh mục hàng!",
            code: -1,
            data: false
        });
    }
};

const createProductController = async (req: Request, res: Response): Promise<any> => {
    try {
        const data = req.body;
        
        if (!data.name || !data.description || !data.price || !data.categoryId) {
            return res.status(400).json({
                message: "Thiếu dữ liệu cần thiết!",
                code: 2,
                data: false
            });
        }

        if (data.features && typeof data.features === "string") {
            data.features = JSON.parse(data.features);
        }
        if (data.variants && typeof data.variants === "string") {
            data.variants = JSON.parse(data.variants);
        }

        const files = req.files as Express.Multer.File[];
        if (files && files.length > 0) {
            data.medias = files.map((file) => ({
                url: (file as any).path,
                type: file.mimetype.startsWith("video") ? 2 : 1,
            }));
        }

        const result: ReturnData = await adminService.createProduct(data);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi tạo sản phẩm!",
            code: -1,
            data: false
        });
    }
};

const updateProductController = async (req: Request, res: Response): Promise<any> => {
    try {
        const data = req.body;
        if (isNaN(data.id) || data.id <= 0) {
            return res.status(400).json({
                message: "ID sản phẩm không hợp lệ!",
                code: 2,
                data: false
            });
        }
        if (data.categoryId && (isNaN(Number(data.categoryId)) || Number(data.categoryId) <= 0)) {
            return res.status(400).json({
                message: "ID danh mục sản phẩm không hợp lệ!",
                code: 2,
                data: false
            });
        }
        if (!data.name || !data.description || !data.price || !data.categoryId) {
            return res.status(400).json({
                message: "Thiếu dữ liệu cần thiết!",
                code: 2,
                data: false
            });
        }

        const files = req.files as Express.Multer.File[];
        const remainingImages = data.remainingImages ? JSON.parse(data.remainingImages) : [];
        const remainingVideos = data.remainingVideos ? JSON.parse(data.remainingVideos) : [];
        
        let newMedias: any[] = [];
        if (files && files.length > 0) {
            newMedias = files.map((file) => ({
                url: (file as any).path,
                type: file.mimetype.startsWith("video") ? 2 : 1,
            }));
        }

        data.medias = [
            ...remainingImages.map((url: string) => ({ url, type: 1 })),
            ...remainingVideos.map((url: string) => ({ url, type: 2 })),
            ...newMedias
        ];

        const result: ReturnData = await adminService.updateProduct(data.id, data);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi cập nhật sản phẩm!",
            code: -1,
            data: false
        });
    }
};

const deleteProductController = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.query.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                message: "ID sản phẩm không hợp lệ!",
                code: 2,
                data: false
            });
        }

        const result = await adminService.deleteProduct(id);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi xóa sản phẩm!",
            code: -1,
            data: false
        });
    }
};

// Variants
const getProductDetailController = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.query.id);
        const result: ReturnData = await adminService.getProdctDetail(id);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server thông tin chi tiết sản phẩm!",
            code: -1,
            data: false
        });
    }
};

const getAllVariantsController = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.query.id);
        const page = Number(req.query.page);
        const limit = Number(req.query.limit)
        const result: ReturnData = await adminService.getAllVariants(id, page, limit);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server thông tin chi tiết sản phẩm!",
            code: -1,
            data: false
        });
    }
};

const getVariantByIdController = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.query.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                message: "ID biến thể không hợp lệ!",
                code: 2,
                data: false
            });
        }

        const result: ReturnData = await adminService.getVariantById(id);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi lấy thông tin biến thể!",
            code: -1,
            data: false
        });
    }
};

const createVariantController = async (req: Request, res: Response): Promise<any> => {
    try {
        const data = req.body;
        if (isNaN(data.productId) || data.productId <= 0) {
            return res.status(400).json({
                message: "ID sản phẩm không hợp lệ!",
                code: 2,
                data: false
            });
        }

        if (!data.size || !data.color || !data.price || !data.quantity) {
            return res.status(400).json({
                message: "Thiếu dữ liệu cần thiết!",
                code: 2,
                data: false
            });
        }
        const result: ReturnData = await adminService.createVariant(data, data.productId);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi tạo biến thể!",
            code: -1,
            data: false
        });
    }
};

const updateVariantController = async (req: Request, res: Response): Promise<any> => {
    try {
        const data = req.body;
        if (isNaN(data.id) || data.id <= 0) {
            return res.status(400).json({
                message: "ID biến thể không hợp lệ!",
                code: 2,
                data: false
            });
        }

        if (!data.size || !data.color || !data.price || !data.quantity) {
            return res.status(400).json({
                message: "Thiếu dữ liệu cần thiết!",
                code: 2,
                data: false
            });
        }

        const result: ReturnData = await adminService.updateVariant(data);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi cập nhật biến thể!",
            code: -1,
            data: false
        });
    }
};

const deleteVariantController = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.query.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                message: "ID biến thể không hợp lệ!",
                code: 2,
                data: false
            });
        }

        const result = await adminService.deleteVariant(id);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi xóa biến thể!",
            code: -1,
            data: false
        });
    }
};

/** Quản lý đơn hàng */
const getStatusController = async (req: Request, res: Response): Promise<any> => {
    try {
        const result: ReturnData = await adminService.getStatus();
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server lấy danh sách trạng thái đơn hàng!",
            code: -1,
            data: false
        });
    }
};

const getAllOrdersController = async (req: Request, res: Response): Promise<any> => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search ? String(req.query.search) : "";
        const fromDate = req.query.fromDate ? String(req.query.fromDate) : "";
        const toDate = req.query.toDate ? String(req.query.toDate) : "";
        const status = req.query.status ? Number(req.query.status) : -1;

        const result = await adminService.getAllOrders(page, limit, search, fromDate, toDate, status);

        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Lỗi server lấy danh sách đơn hàng!",
            code: -1,
            data: false,
        });
    }
};

const getBillController = async (req: Request, res: Response): Promise<any> => {
    try {
        const orderId = req.query.id;
        const result = await adminService.getBill(Number(orderId));

        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Lỗi server lấy thông tin hóa đơn!",
            code: -1,
            data: false,
        });
    }
};

/** Quản lý khách hàng */
const getAllCustomersController = async (req: Request, res: Response): Promise<any> => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search ? String(req.query.search) : "";

        const result = await adminService.getAllCustomers(page, limit, search);

        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Lỗi server lấy danh sách khách hàng!",
            code: -1,
            data: false,
        });
    }
};

const getCustomerDetailController = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.query.id);
        let message = "";
        if (isNaN(id) || id <= 0) {
            message = "ID khách hàng không hợp lệ!";
        } else if (id !== 2) {
            message = "ID không phải là khách hàng!";
        }
        if (message) {
            return res.status(400).json({
                message,
                code: 2,
                data: false
            });
        }

        const result = await adminService.getCustomerDetail(id);

        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Lỗi server lấy thông tin khách hàng!",
            code: -1,
            data: false,
        });
    }
};

const getCustomerOrdersController = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.query.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                message: "ID khách hàng không hợp lệ!",
                code: 2,
                data: false
            });
        }

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const result = await adminService.getCustomerOrders(id, page, limit);

        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Lỗi server lấy danh sách đơn hàng của khách hàng!",
            code: -1,
            data: false,
        });
    }
};

/** Quản lý chương trình ưu đãi */
const getAllPromotionsController = async (req: Request, res: Response): Promise<any> => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search ? String(req.query.search) : "";
        const fromDate = req.query.fromDate ? String(req.query.fromDate) : "";
        const toDate = req.query.toDate ? String(req.query.toDate) : "";

        const result = await adminService.getAllPromotions(page, limit, search, fromDate, toDate);

        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Lỗi server lấy danh sách chương trình ưu đãi!",
            code: -1,
            data: false,
        });
    }
};

const getPromotionProductsController = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.query.promotionId);
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search ? String(req.query.search) : "";
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                message: "ID ưu đãi không hợp lệ!",
                code: 2,
                data: false
            });
        }

        const result = await adminService.getPromotionProducts(id, page, limit, search);

        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Lỗi server lấy danh sách sản phẩm của ưu đãi!",
            code: -1,
            data: false,
        });
    }
};

const getPromotionByIdController = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.query.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                message: "ID ưu đãi không hợp lệ!",
                code: 2,
                data: false
            });
        }

        const result: ReturnData = await adminService.getPromotionById(id);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi lấy thông tin ưu đãi!",
            code: -1,
            data: false
        });
    }
};

const getProductsByCategoryController = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.query.categoryId);
        const search = req.query.search ? String(req.query.search) : "";
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                message: "ID danh mục không hợp lệ!",
                code: 2,
                data: false
            });
        }

        const result: ReturnData = await adminService.getProductsByCategory(id, search);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi lấy danh sách sản phẩm theo danh mục!",
            code: -1,
            data: false
        });
    }
};

const createPromotionController = async (req: Request, res: Response): Promise<any> => {
    try {
        const data = req.body;
        
        if (!data.percent || !data.startDate || !data.endDate) {
            return res.status(400).json({
                message: "Thiếu dữ liệu cần thiết!",
                code: 2,
                data: false
            });
        }

        const result: ReturnData = await adminService.createPromotion(data);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi tạo chương trình ưu đãi!",
            code: -1,
            data: false
        });
    }
};

const updatePromotionController = async (req: Request, res: Response): Promise<any> => {
    try {
        const data = req.body;
        if (isNaN(data.id) || data.id <= 0) {
            return res.status(400).json({
                message: "ID chương trình ưu đãi không hợp lệ!",
                code: 2,
                data: false
            });
        }
        if (!data.percent || !data.startDate || !data.endDate) {
            return res.status(400).json({
                message: "Thiếu dữ liệu cần thiết!",
                code: 2,
                data: false
            });
        }

        const result: ReturnData = await adminService.updatePromotion(data.id, data);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi cập nhật chương trình ưu đãi!",
            code: -1,
            data: false
        });
    }
};

const deletePromotionController = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.query.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                message: "ID chương trình ưu đãi không hợp lệ!",
                code: 2,
                data: false
            });
        }

        const result = await adminService.deletePromotion(id);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi xóa chương trình ưu đãi!",
            code: -1,
            data: false
        });
    }
};

/** Quản lý mã khuyến mãi */
const getAllVouchersController = async (req: Request, res: Response): Promise<any> => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search ? String(req.query.search) : "";
        const fromDate = req.query.fromDate ? String(req.query.fromDate) : "";
        const toDate = req.query.toDate ? String(req.query.toDate) : "";
        const type = Number(req.query.type);

        const result = await adminService.getAllVouchers(page, limit, search, fromDate, toDate, type);

        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Lỗi server lấy danh sách mã khuyến mãi!",
            code: -1,
            data: false,
        });
    }
};

const getVoucherDetailController = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.query.id);
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                message: "ID mã khuyến mãi không hợp lệ!",
                code: 2,
                data: false
            });
        }

        const result = await adminService.getVoucherDetail(id, page, limit);

        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Lỗi server thông tin mã khuyến mãi!",
            code: -1,
            data: false,
        });
    }
};

const getVoucherByIdController = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.query.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                message: "ID mã giảm giá không hợp lệ!",
                code: 2,
                data: false
            });
        }

        const result: ReturnData = await adminService.getVoucherById(id);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi lấy thông tin mã giảm giá!",
            code: -1,
            data: false
        });
    }
};

const getVoucherCategoriesController = async(req: Request, res: Response): Promise<any> => {
    try {
        const search = req.query.search ? String(req.query.search) : "";
        const result = await adminService.getVoucherCategories(search);

        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Lỗi server danh sách danh mục!",
            code: -1,
            data: false,
        });
    }
};

const createVoucherController = async (req: Request, res: Response): Promise<any> => {
    try {
        const data = req.body;
        
        if (!data.code || !data.name || !data.discountPercent || 
            !data.startDate || !data.endDate || !data.quantity || !data.type) {
            return res.status(400).json({
                message: "Thiếu dữ liệu cần thiết!",
                code: 2,
                data: false
            });
        }

        const result: ReturnData = await adminService.createVoucher(data);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi tạo mã khuyến mãi!",
            code: -1,
            data: false
        });
    }
};

const updateVoucherController = async (req: Request, res: Response): Promise<any> => {
    try {
        const data = req.body;
        if (isNaN(data.id) || data.id <= 0) {
            return res.status(400).json({
                message: "ID mã khuyến mãi không hợp lệ!",
                code: 2,
                data: false
            });
        }
        if (!data.code || !data.name || !data.discountPercent || 
            !data.startDate || !data.endDate || !data.quantity || !data.type) {
            return res.status(400).json({
                message: "Thiếu dữ liệu cần thiết!",
                code: 2,
                data: false
            });
        }

        const result: ReturnData = await adminService.updateVoucher(data.id, data);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi cập nhật mã khuyến mãi!",
            code: -1,
            data: false
        });
    }
};

const deleteVoucherController = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.query.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                message: "ID mã khuyến mãi không hợp lệ!",
                code: 2,
                data: false
            });
        }

        const result = await adminService.deleteVoucher(id);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi xóa mã khuyến mãi!",
            code: -1,
            data: false
        });
    }
};

/** Quản lý danh mục */
const getAllCategoriesController = async (req: Request, res: Response): Promise<any> => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search ? String(req.query.search) : "";

        const result = await adminService.getAllCategories(page, limit, search);

        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Lỗi server lấy danh sách danh mục hàng!",
            code: -1,
            data: false,
        });
    }
};

const createCategoryController = async (req: Request, res: Response): Promise<any> => {
    try {
        const data = req.body;
        
        if (!data.name) {
            return res.status(400).json({
                message: "Thiếu dữ liệu cần thiết!",
                code: 2,
                data: false
            });
        }

        const result: ReturnData = await adminService.createCategory(data);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi tạo danh mục hàng!",
            code: -1,
            data: false
        });
    }
};

const updateCategoryController = async (req: Request, res: Response): Promise<any> => {
    try {
        const data = req.body;
        if (isNaN(data.id) || data.id <= 0) {
            return res.status(400).json({
                message: "ID danh mục hàng không hợp lệ!",
                code: 2,
                data: false
            });
        }
        if (!data.name) {
            return res.status(400).json({
                message: "Thiếu dữ liệu cần thiết!",
                code: 2,
                data: false
            });
        }

        const result: ReturnData = await adminService.updateCategory(data.id, data);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi cập nhật danh mục hàng!",
            code: -1,
            data: false
        });
    }
};

const deleteCategoryController = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.query.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                message: "ID danh mục hàng không hợp lệ!",
                code: 2,
                data: false
            });
        }

        const result = await adminService.deleteCategory(id);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Lỗi server khi xóa danh mục hàng!",
            code: -1,
            data: false
        });
    }
};

/** Quản lý phản hồi */
const getAllFeedbacksController = async (req: Request, res: Response): Promise<any> => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search ? String(req.query.search) : "";
        const star = Number(req.query.star);
        const fromDate = req.query.fromDate ? String(req.query.fromDate) : "";
        const toDate = req.query.toDate ? String(req.query.toDate) : "";

        const result = await adminService.getAllFeedbacks(page, limit, search, star, fromDate, toDate);

        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Lỗi server lấy danh sách phản hồi!",
            code: -1,
            data: false,
        });
    }
};

export default {
    getRecentOrdesController, getSalesDataController, getCategoriesSaleController, 
    getAllProductsController, getProductByIdController, getProductCategoriesController, createProductController, updateProductController, deleteProductController,
    getProductDetailController, getAllVariantsController, getVariantByIdController, createVariantController, updateVariantController, deleteVariantController,
    getStatusController, getAllOrdersController, getBillController,
    getAllCustomersController, getCustomerDetailController, getCustomerOrdersController,
    getAllPromotionsController, getPromotionProductsController, getPromotionByIdController, getProductsByCategoryController, createPromotionController, updatePromotionController, deletePromotionController,
    getAllVouchersController, getVoucherDetailController, getVoucherByIdController, getVoucherCategoriesController, createVoucherController, updateVoucherController, deleteVoucherController,
    getAllCategoriesController, createCategoryController, updateCategoryController, deleteCategoryController, getAllFeedbacksController
}