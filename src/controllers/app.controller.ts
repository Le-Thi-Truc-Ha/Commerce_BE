import { Request, Response } from "express";
import { controllerError, dataError, returnController, ReturnData, SessionValue } from "../interfaces/app.interface";
import { deleteOneSession, verifySession } from "../middleware/jwt";
import * as appService from "../services/app.service";

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
        return controllerError;
    }
}

export const googleLoginController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {userInformation} = req.body;
        if (!userInformation) {
            return res.status(200).json(dataError)
        }
        const result: ReturnData = await appService.googleLoginService(userInformation);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}

export const normalLoginController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {email, password} = req.body;
        if (!email || !password) {
            return res.status(200).json(dataError)
        }
        const result: ReturnData = await appService.normalLoginService(email, password);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
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
        return controllerError;
    }
}

export const checkEmailController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {email} = req.body;
        if (!email) {
            return res.status(200).json(dataError)
        }
        const result = await appService.checkEmailService(email);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}

export const checkOtpController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {email, otp} = req.body;
        if (!email || !otp) {
            return res.status(200).json(dataError)
        }
        const result = await appService.checkOtpService(email, otp);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}

export const resetPasswordController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {email, newPassword} = req.body;
        if (!email || !newPassword) {
            return res.status(200).json(dataError)
        }
        const result = await appService.resetPasswordService(email, newPassword);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}

export const verifyEmailController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {email} = req.body;
        if (!email) {
            return res.status(200).json(dataError)
        }
        const result = await appService.verifyEmailService(email);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}

export const createAccountController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {otp, email, name, dob, gender, password} = req.body;
        if (!otp || !email || !name || !password) {
            return res.status(200).json(dataError)
        }
        const result: ReturnData = await appService.createAccountService(otp, email, name, dob, gender, password);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}

export const getBestSellerController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId} = req.query;
        if (!accountId || isNaN(Number(accountId))) {
            return res.status(200).json(dataError);
        }

        const result: ReturnData = await appService.getBestSellerService(Number(accountId));
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}

export const getProductController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, nowCategory, nowSort, nowPage} = req.body;
        if (!accountId || nowCategory == undefined || nowSort == undefined || nowPage == undefined) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await appService.getProductService(accountId, nowCategory, nowSort, nowPage);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}