import { Request, Response } from "express";
import { ReturnData, SessionValue } from "../interfaces/app.interface";
import { deleteOneSession, verifySession } from "../middleware/jwt";
import appService from "../services/app.service";

const reloadPageController = async (req: Request, res: Response): Promise<any> => {
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

const googleLoginController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {userInformation} = req.body;
        if (!userInformation) {
            return res.status(200).json({
                message: "Không nhận được dữ liệu",
                code: 1,
                data: false
            })
        }
        const result: ReturnData = await appService.googleLoginService(userInformation);
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

const normalLoginController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {email, password} = req.body;
        if (!email || !password) {
            return res.status(200).json({
                message: "Không nhận được dữ liệu",
                code: 1,
                data: false
            })
        }
        const result: ReturnData = await appService.normalLoginService(email, password);
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

const logoutController = async (req: Request, res: Response): Promise<any> => {
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

const checkEmailController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {email} = req.body;
        if (!email) {
            return res.status(200).json({
                message: "Không nhận được dữ liệu",
                code: 1,
                data: false
            })
        }
        const result = await appService.checkEmailService(email);
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

const checkOtpController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {email, otp} = req.body;
        if (!email || !otp) {
            return res.status(200).json({
                message: "Không nhận được dữ liệu",
                code: 1,
                data: false
            })
        }
        const result = await appService.checkOtpService(email, otp);
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

const resetPasswordController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {email, newPassword} = req.body;
        if (!email || !newPassword) {
            return res.status(200).json({
                message: "Không nhận được dữ liệu",
                code: 1,
                data: false
            })
        }
        const result = await appService.resetPasswordService(email, newPassword);
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

const verifyEmailController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {email} = req.body;
        if (!email) {
            return res.status(200).json({
                message: "Không nhận được dữ liệu",
                code: 1,
                data: false
            })
        }
        const result = await appService.verifyEmailService(email);
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

const createAccountController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {otp, email, name, phone, dob, gender, password} = req.body;
        if (!otp || !email || !name || !password) {
            return res.status(200).json({
                message: "Không nhận được dữ liệu",
                data: false,
                code: 1
            })
        }
        const result: ReturnData = await appService.createAccountService(otp, email, name, phone && phone.length == 0 ? null : phone, dob, gender, password);
        return res.status(200).json({
            message: result.message,
            data: result.data,
            code: result.code
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

export default {
    reloadPageController, googleLoginController, normalLoginController, logoutController,
    checkEmailController, checkOtpController, resetPasswordController, verifyEmailController,
    createAccountController
}