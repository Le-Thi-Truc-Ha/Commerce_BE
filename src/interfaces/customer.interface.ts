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
    status: number
}