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

const createAddressController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, name, phone, address, isDefault} = req.body;
        if (!accountId || !name || !phone || !address || isDefault == undefined) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.createAddressService(accountId, name, phone, address, isDefault);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}

const getAllAddressController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId} = req.query;
        if (!accountId || isNaN(Number(accountId))) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.getAllAddressService(Number(accountId));
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}

const getAddressController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {addressId, accountId} = req.query;
        if (!addressId || isNaN(Number(addressId)) || !accountId || isNaN(Number(accountId))) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.getAddressService(Number(addressId), Number(accountId));
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}

const updateAddressController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {addressId, accountId, name, phone, address, isDefault} = req.body;
        if (!addressId || !accountId || !name || !phone || !address || isDefault == undefined) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.updateAddressService(addressId, accountId, name, phone, address, isDefault);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}

const deleteAddressController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, idDelete} = req.body;
        if (!accountId || !idDelete) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.deleteAddressService(accountId, idDelete);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}

export default {
    getAccountInformationController, saveAccountInformationController, savePasswordController,
    createAddressController, getAllAddressController, getAddressController, updateAddressController,
    deleteAddressController
}