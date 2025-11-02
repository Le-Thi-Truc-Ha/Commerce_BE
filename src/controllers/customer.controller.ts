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
        return res.status(500).json(controllerError);
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
        return res.status(500).json(controllerError);
    }
}

export const savePasswordController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, oldPassword, newPassword} = req.body;
        if (!accountId || !newPassword) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.savePasswordService(accountId, oldPassword, newPassword);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const createAddressController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, name, phone, address, isDefault, longitude, latitude} = req.body;
        if (!accountId || !name || !phone || !address || isDefault == undefined || !longitude || !latitude) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.createAddressService(accountId, name, phone, address, isDefault, longitude, latitude);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
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
        return res.status(500).json(controllerError);
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
        return res.status(500).json(controllerError);
    }
}

export const updateAddressController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {addressId, accountId, name, phone, address, isDefault, longitude, latitude} = req.body;
        if (!addressId || !accountId || !name || !phone || !address || isDefault == undefined || !longitude || !latitude) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.updateAddressService(addressId, accountId, name, phone, address, isDefault, longitude, latitude);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
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
        return res.status(500).json(controllerError);
    }
}

export const addFavouriteController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, productId} = req.body;
        if (!accountId || !productId) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.addFavouriteService(accountId, productId);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const deleteFavouriteController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, productId, take} = req.body;
        if (!accountId || !productId || !take) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.deleteFavouriteService(accountId, productId, take);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const getAllFavouriteController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, page} = req.query;
        if (!accountId || isNaN(Number(accountId)) || !page || isNaN(Number(page))) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.getAllFavouriteService(Number(accountId), Number(page));
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const getAllHistoryController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, page} = req.query;
        if (!accountId || isNaN(Number(accountId)) || !page || isNaN(Number(page))) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.getAllHistoryService(Number(accountId), Number(page));
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const addCartController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, productId, productVariantId, quantity, now} = req.body;
        if (!accountId || !productId || !productVariantId || !quantity || !now) {
            return res.status(200).json(dataError);
        }
        
        const result: ReturnData = await customerService.addCartService(accountId, productId, productVariantId, quantity, now);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const getProductInCartController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, page} = req.body;
        if (!accountId || !page) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.getProductInCartService(accountId, page);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const updateQuantityCartController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {quantityCart, now} = req.body;
        if (!quantityCart || !now) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.updateQuantityCartService(quantityCart, now);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const deleteProductInCartController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {cartId, productId, take, now} = req.body;
        if (!cartId || !productId || !take || !now) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.deleteProductInCartService(cartId, productId, take, req.user?.accountId ?? -1, now);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const getProductDetailModalController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, productId} = req.body;
        if (!accountId || !productId) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.getProductDetailModalService(accountId, productId);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const updateVariantInCartController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {cartId, accountId, variantId, quantity, now} = req.body;
        if (!cartId || !accountId || !variantId || !quantity || !now) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.updateVariantInCartService(cartId, accountId, variantId, quantity, now);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const getAddressAndFeeController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId} = req.body;
        if (!accountId) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.getAddressAndFeeService(accountId);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const getVoucherController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, productId, totalPrice} = req.body;
        if (!accountId || !productId || !totalPrice) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.getVoucherService(accountId, productId, totalPrice);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const orderProductController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, productOrder, address, totalPrice, orderDate, note, voucherUse, shippingFeeId, paymentMethod, finalPrice} = req.body;
        if (!accountId || !productOrder || !address || !totalPrice || !orderDate || note == undefined || !voucherUse || !shippingFeeId || paymentMethod == undefined || !finalPrice) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.orderProductService(accountId, productOrder, address, totalPrice, orderDate, note, voucherUse, shippingFeeId, paymentMethod, finalPrice);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const getOrderListController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, status, page} = req.body;
        if (!accountId || !status || !page) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.getOrderListService(accountId, status, page);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const getOrderDetailController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {accountId, orderId} = req.body;
        if (!accountId || !orderId) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.getOrderDetailService(accountId, orderId);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const confirmReceiveProductController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {orderId, now} = req.body;
        if (!orderId || !now) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.confirmReceiveProductService(orderId, now);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}

export const returnProductController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {orderId, take, now, accountId, status, reason, mode, productId, productVariantId, quantity} = req.body;
        if (!orderId || take == undefined || !now || !accountId || !status || !reason || !mode || !productId || !productVariantId ||!quantity) {
            return res.status(200).json(dataError);
        }
        const result: ReturnData = await customerService.returnProductService(orderId, take, now, accountId, status, reason, mode, productId, productVariantId, quantity);
        returnController(result, res);
    } catch(e) {
        console.log(e);
        return res.status(500).json(controllerError);
    }
}