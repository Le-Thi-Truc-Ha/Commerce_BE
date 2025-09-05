import { Request, Response } from "express";
import { ReturnData, SessionValue } from "../interfaces/app.interface";
import { checkEmailService, googleLoginService, normalLoginService } from "../services/app.service";
import { deleteOneSession, verifySession } from "../middleware/jwt";

export const reloadPageController = async (req: Request, res: Response): Promise<any> => {
    try {
        const authHeader = req.headers["authorization"];
        const sessionKey = authHeader && authHeader.split(" ")[1];

        if (!sessionKey) {
            return res.status(200).json({
                message: "Bạn chưa đăng nhập",
                data: false,
                code: 1,
            });
        }
        
        const sessionValue: SessionValue | null = await verifySession(sessionKey);

        if (!sessionValue) {
            return res.status(200).json({
                message: "Session không hợp lệ",
                data: false,
                code: 1,
            });
        }

        return res.status(200).json({
            message: "Xác thực thành công",
            code: 0,
            data: sessionValue
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

export const normalLoginController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {email, password} = req.body;
        if (!email || !password) {
            return res.status(200).json({
                message: "Không nhận được dữ liệu",
                code: 1,
                data: false
            })
        }
        const result: ReturnData = await normalLoginService(email, password);
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
        const sessionKey = authHeader && authHeader.split(" ")[1];

        if (!sessionKey) {
            return res.status(200).json({
                message: "Bạn chưa đăng nhập",
                data: false,
                code: 1,
            });
        }

        await deleteOneSession(sessionKey);

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

export const checkEmailController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {email} = req.body;
        if (!email) {
            return res.status(200).json({
                message: "Không nhận được dữ liệu",
                code: 1,
                data: false
            })
        }
        const result = await checkEmailService(email);
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