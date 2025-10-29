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

/** Quản lý sản phẩm */
export interface ProductFeature {
    neckline?: string;
    sleeve?: string;
    pantLength?: string;
    pantShape?: string;
    dressLength?: string;
    dressShape?: string;
    skirtLength?: string;
    skirtShape?: string;
}

export interface Media {
    id: number;
    url: string;
    type: number;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    categoryId: number;
    category: { id: number; name: string; };
    medias: { url: string; type: number; }[];
    productVariants: { 
        quantity: number; 
        status: number; 
        price: number;
    }[];
    features: ProductFeature;
    variants: [];
    fit: string;
    material: string;
    occasion: string;
    season: string;
    style: string;
    age: string;    
}

export interface Variant {
    id: number;
    size: string;
    color: string;
    price: number;
    quantity: number;
    status: number;
}

export interface Promotion {
    id: number;
    percent: number,
    startDate: string,
    endDate: string,
    productIds: {id: number}[];
}
