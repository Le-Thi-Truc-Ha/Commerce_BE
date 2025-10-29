import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export interface ReturnData<T = any> {
    message: string;
    code: number;
    data: T | false;
}

/** Dashboard */
export interface OrderDash {
    id: number;
    account: { fullName: string };
    total: number;
    orderDate: string;
    currentStatus: number;
}

export interface SalesDataDash {
    month: string;
    revenue: number;
    orders: number;
}

export interface CategoryDash {
    name: string;
    value: number;
}
