import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export interface PayloadData {
    id: number,
    roleId: number
}

export interface ReturnData {
    message: string,
    data: any,
    code: number
}