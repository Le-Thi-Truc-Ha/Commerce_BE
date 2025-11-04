import { findValueService } from './../services/app.service';
import { Request, Response } from "express";
import { controllerError, dataError, returnController, ReturnData, SessionValue } from "../interfaces/app.interface";
import { createSession, deleteOneSession, verifySession } from "../middleware/jwt";
import * as appService from "../services/app.service";
import { v1 as uuidv1 } from "uuid"; 
import { redis } from "../configs/redis";
import { updateQuantityCartService } from "../services/customer.service";

export const awakeBackendController = (req: Request, res: Response): any => {
    console.log("Awake Backend");
    return res.status(200).send("Awake Success");
}

export const reloadPageController = async (req: Request, res: Response): Promise<any> => {
    try {
        const authHeader = req.headers["authorization"];
        const sessionKey = authHeader && authHeader.split(" ")[1];

        if (!sessionKey) {
            const uuid = uuidv1();
            await redis.set(uuid, JSON.stringify({accountId: -1, roleId: 2, googleLogin: false}), "EX", 60*60*24*30);
            return res.status(200).json({
                message: "Bạn chưa đăng nhập",
                data: uuid,
                code: 2,
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

        if (sessionValue.accountId == -1) {
            return res.status(200).json({
                message: "Bạn chưa đăng nhập",
                data: false,
                code: 1,
            });
        }

        const result = await appService.reloadPageService(sessionValue.accountId);

        return res.status(200).json({
            message: "Xác thực thành công",
            code: 0,
            data: {account: sessionValue, cart: result.data}
        })
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const googleLoginController = async (req: Request, res: Response): Promise<any> => {
    try {
        const authHeader = req.headers["authorization"];
        const sessionKey = authHeader && authHeader.split(" ")[1];
        
        const {userInformation} = req.body;
        if (!userInformation) {
            return res.status(200).json(dataError)
        }
        const result: ReturnData = await appService.googleLoginService(userInformation, sessionKey);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const normalLoginController = async (req: Request, res: Response): Promise<any> => {
    try {
        const authHeader = req.headers["authorization"];
        const sessionKey = authHeader && authHeader.split(" ")[1];

        const {email, password} = req.body;
        if (!email || !password) {
            return res.status(200).json(dataError)
        }

        const result: ReturnData = await appService.normalLoginService(email, password, sessionKey);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
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
        return res.status(500).json(controllerError);
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
        return res.status(500).json(controllerError);
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
        return res.status(500).json(controllerError);
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
        return res.status(500).json(controllerError);
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
        return res.status(500).json(controllerError);
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
        return res.status(500).json(controllerError);
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
        return res.status(500).json(controllerError);
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
        return res.status(500).json(controllerError);
    }
}

export const getProductDetailController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, productId, pageRate} = req.body;
        if (!accountId || !productId || !pageRate) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await appService.getProductDetailService(accountId, productId ,pageRate);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const saveHistoryController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, productId, now} = req.body;
        if (!accountId || !productId || !now) {
            return res.status(200).json(dataError);
        }

        let sessionKey = undefined;
        if (accountId == -1) {
            const authHeader = req.headers["authorization"];
            sessionKey = authHeader && authHeader.split(" ")[1];
        }

        const result: ReturnData = await appService.saveHistoryService(accountId, productId, now, sessionKey);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const updateCartLeaveController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {quantityCart, updateAt} = req.body;
        if (!quantityCart || !updateAt) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await updateQuantityCartService(quantityCart, updateAt);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const checkUpdateCartController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {cartId} = req.body;
        if (!cartId) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await appService.checkUpdateCartService(cartId);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const findValueController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, findValue, productId, currentPage} = req.body;
        if (!accountId || !findValue || !currentPage) {
            return res.status(200).json(dataError);
        }

        let sessionKey = undefined;
        if (accountId == -1) {
            const authHeader = req.headers["authorization"];
            sessionKey = authHeader && authHeader.split(" ")[1];
        }

        const result: ReturnData = await appService.findValueService(findValue, productId, currentPage, req.user?.accountId ?? -1, sessionKey);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const getRateController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {productId, filter, page} = req.body;
        if (!productId || filter == undefined || page == undefined) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await appService.getRateService(productId, filter, page);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const confirmReceiveProductController = async (req: Request, res: Response): Promise<any> => {
    try {
        const result: ReturnData = await appService.confirmReceiveProductService();
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}