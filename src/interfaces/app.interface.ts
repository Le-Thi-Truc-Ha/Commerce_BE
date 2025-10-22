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

export const productInfomation = (now: Date) => ({
    id: true,
    status: true,
    saleFigure: true,
    medias: {
        take: 1,
        select: {
            url: true
        }
    },
    name: true,
    productVariants: {
        where: {
            status: 1
        },
        orderBy: {
            price: "asc" as const
        },
        take: 1,
        select: {
            price: true
        }
    },
    rateStar: true,
    productPromotions: {
        select: {
            promotion: {
                where: {
                    AND: [
                        {startDate: {lte: now}},
                        {endDate: {gte: now}},
                        {status: 1}
                    ]
                },
                select: {
                    percent: true
                }
            }
        }
    },
    category: {
        select: {
            id: true,
            parentId: true
        }
    }
})