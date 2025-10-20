import { Request, Response } from "express";
import { controllerError, dataError, returnController, ReturnData } from "../interfaces/app.interface";
import * as customerService from "../services/customer.service";

export const getAccountInformationController = async (req: Request, res: Response): Promise<any> => {
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

export const saveAccountInformationController = async (req: Request, res: Response): Promise<any> => {
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

export const savePasswordController = async (req: Request, res: Response): Promise<any> => {
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

export const createAddressController = async (req: Request, res: Response): Promise<any> => {
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

export const getAllAddressController = async (req: Request, res: Response): Promise<any> => {
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

export const getAddressController = async (req: Request, res: Response): Promise<any> => {
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

export const updateAddressController = async (req: Request, res: Response): Promise<any> => {
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

export const deleteAddressController = async (req: Request, res: Response): Promise<any> => {
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

export const addFavouriteController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, productId, now, seen} = req.body;
        if (!accountId || !productId || !now || seen == undefined || seen == null) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.addFavouriteService(accountId, productId, now, seen);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return controllerError;
    }
}