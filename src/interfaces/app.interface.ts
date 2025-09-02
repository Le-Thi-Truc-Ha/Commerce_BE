import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export interface PayloadData {
    id: number,
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