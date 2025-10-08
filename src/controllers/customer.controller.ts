import { Request, Response } from "express";
import { ReturnData } from "../interfaces/app.interface";
import customerService from "../services/customer.service";

const controllerError: ReturnData = {
    message: "Xảy ra lỗi ở controller",
    data: false,
    code: -1
}
const dataError: ReturnData = {
    message: "Không nhận được dữ liệu",
    data: false,
    code: 1
}
const returnController = (result: ReturnData, res: Response) => {
    return res.status(200).json({
        message: result.message,
        data: result.data,
        code: result.code
    })
}

const getAccountInformationController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId} = req.query;
        if (!accountId || isNaN(Number(accountId))) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.getAccountInformationService(Number(accountId));
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}

const saveAccountInformationController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, name, email, dob, gender} = req.body;
        if (!accountId || !name || !email) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.saveAccountInformationService(accountId, name, email, dob, gender);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}

const savePasswordController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, oldPassword, newPassword} = req.body;
        if (!accountId || !oldPassword || !newPassword) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.savePasswordService(accountId, oldPassword, newPassword);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}

export default {
    getAccountInformationController, saveAccountInformationController, savePasswordController
}