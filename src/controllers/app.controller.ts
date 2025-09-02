import { Request, Response } from "express";
import { PayloadData, ReturnData } from "../interfaces/app.interface";
import { googleLoginService } from "../services/app.service";
import { verifyIdToken, verifyToken } from "../middleware/jwt";

export const reloadPageController = async (req: Request, res: Response): Promise<any> => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(200).json({
                message: "Bạn chưa đăng nhập",
                data: false,
                code: 1,
            });
        }
        
        const decoded: PayloadData = verifyToken(token);

        return res.status(200).json({
            message: "Thành công",
            code: 0,
            data: {
                id: decoded.id,
                roleId: decoded.roleId,
                googleLogin: decoded.googleLogin
            }
        })
    } catch(e) {
        console.log(e);
        return res.status(500).json({
            message: "Xảy ra lỗi ở controller",
            data: false,
            code: -1
        })
    }
}

export const googleLoginController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {userInformation} = req.body;
        if (!userInformation) {
            return res.status(200).json({
                message: "Không nhận được dữ liệu",
                code: 1,
                data: false
            })
        }
        const result: ReturnData = await googleLoginService(userInformation);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        })
    } catch(e) {
        console.log(e);
        return res.status(500).json({
            message: "Xảy ra lỗi ở controller",
            data: false,
            code: -1
        })
    }
}

export const logoutController = async (req: Request, res: Response): Promise<any> => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(200).json({
                message: "Bạn chưa đăng nhập",
                data: false,
                code: 1,
            });
        }

        return res.status(200).json({
            message: "Đăng xuất thành công",
            code: 0,
            data: true
        })
    } catch(e) {
        console.log(e);
        return res.status(500).json({
            message: "Xảy ra lỗi ở controller",
            data: false,
            code: -1
        })
    }
}