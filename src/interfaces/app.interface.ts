import { PrismaClient } from "@prisma/client";
import { Response } from "express";

export const prisma = new PrismaClient();

export interface SessionValue {
    accountId: number,
    roleId: number,
    googleLogin: boolean
}

export interface ReturnData {
    message: string,
    data: any,
    code: number
}

export interface GoogleUser {
    name: string,
    email: string,
    idToken: string,
    uid: string
}

export const serviceError: ReturnData = {
    message: "Xảy ra lỗi ở service",
    data: false,
    code: -1
}

export const controllerError: ReturnData = {
    message: "Xảy ra lỗi ở controller",
    data: false,
    code: -1
}
export const dataError: ReturnData = {
    message: "Không nhận được dữ liệu",
    data: false,
    code: 1
}

export const notFound: ReturnData = {
    message: "Không tìm thấy dữ liệu",
    data: false,
    code: 1
}

export const success = (message: string, data: any) => {
    return({
        message: message,
        data: data,
        code: 0
    })
}

export const returnController = (result: ReturnData, res: Response) => {
    return res.status(200).json({
        message: result.message,
        data: result.data,
        code: result.code
    })
}