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

export default {
    getRecentOrdesController, getSalesDataController, getCategoriesSaleController, 
}