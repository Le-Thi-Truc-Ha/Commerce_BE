export interface UserInformation {
    name: string,
    email: string,
    dob: Date | null,
    gender: string | null
}

export interface CartProduct {
    productId: number,
    productVariantId: number,
    cartId: number,
    parentCategory: string,
    url: string, 
    name: string, 
    price: number, 
    discount: number | null,
    color: string, 
    size: string, 
    quantityOrder: number,
    quantity: number,
    statusCart: number,
    statusProduct: number
}

export interface AddressInformation {
    id: number,
    name: string,
    phone: string,
    address: string,
    longitude: number,
    latitude: number
}

export interface VoucherUse {
    productVoucher: {
        voucherId: number, 
        voucherCode: string,
        productId: number[]
    } | null,
    shipVoucher: {
        voucherId: number,
        voucherCode: string
    } | null 
}

export interface OrderData {
    status: number,
    id: number,
    orderDate: string,
    productId: number[],
    productVariantId: number[],
    url: string[],
    name: string[],
    price: number[],
    discount: number[],
    size: string[],
    color: string[],
    quantity: number[],
    total: number,
    paymentTime: string | null,
    paymentMethod: number,
    statusHistory: {
        id: number,
        status: number,
        date: Date
    }[]
}

export interface OrderDetailData {
    overallData: OrderData,
    star: (number | null)[],
    paymentStatus: number,
    orderNote: string | null,
    returnReason: string | null,
    cancelReason: string | null,
    address: {
        address: string,
        name: string,
        phoneNumber: string
    },
    shippingFee: number,
    shipDiscount: number,
    productDiscount: number
}