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

export default {
    getRecentOrdesController, getSalesDataController, getCategoriesSaleController, 
    getAllProductsController, getProductByIdController, getProductCategoriesController, createProductController, updateProductController, deleteProductController,
}