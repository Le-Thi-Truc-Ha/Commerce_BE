import { compare, genSalt, hash } from "bcrypt-ts";
import { notFound, prisma, productInfomation, ReturnData, serviceError, success } from "../interfaces/app.interface";
import { AddressInformation, CartProduct, OrderData, OrderDetailData, UserInformation, VoucherUse } from "../interfaces/customer.interface";
import dayjs from "dayjs";
import { dmmfToRuntimeDataModel } from "@prisma/client/runtime/edge";

export const getAccountInformationService = async (accountId: number): Promise<ReturnData> => {
    try {
        const account = await prisma.account.findFirst({
            where: {
                AND: [
                    {id: accountId},
                    {status: 1}
                ]
            },
            select: {
                fullName: true,
                email: true,
                dob: true,
                gender: true
            }
        })
        if (!account) {
            return notFound
        }
        const accountInfomation: UserInformation = {
            name: account.fullName,
            email: account.email,
            dob: account.dob,
            gender: account.gender
        }
        return success("Lấy dữ liệu thành công", accountInfomation);
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const saveAccountInformationService = async (accountId: number, name: string, email: string, dob: string | null, gender: string | null): Promise<ReturnData> => {
    try {
        const account = await prisma.account.update({
            where: {
                id: accountId
            },
            data: {
                fullName: name,
                dob: dob && new Date(dob),
                gender: gender
            }
        })
        if (!account) {
            return notFound
        }
        return success("Lưu dữ liệu thành công", account);
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const savePasswordService = async (accountId: number, oldPassword: string, newPassword: string): Promise<ReturnData> => {
    try {
        const account = await prisma.account.findFirst({
            where: {
                id: accountId
            },
            select: {
                password: true
            }
        })
        if (!account) {
            return notFound;
        }
        if (account.password) {
            const checkPassword = await compare(oldPassword, account.password);
            if (!checkPassword) {
                return({
                    message: "Mật khẩu cũ không đúng",
                    data: false,
                    code: 1
                })
            }
        }

        const salt = await genSalt(10);
        const hashPassword = await hash(newPassword, salt);

        const updateAccount = await prisma.account.update({
            where: {
                id: accountId
            },
            data: {
                password: hashPassword
            }
        })
        return success("Đổi mật khẩu thành công", updateAccount);
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const createAddressService = async (accountId: number, name: string, phone: string, address: string, isDefault: boolean, longitude: number, latitude: number): Promise<ReturnData> => {
    try {
        const account = await prisma.account.findFirst({
            where: {
                id: accountId
            },
            select: {
                fullName: true
            }
        });
        if (!account) {
            return notFound;
        }
        const createAddressTransaction = await prisma.$transaction(async (tx) => {
            const newAddress = await prisma.address.create({
                data: {
                    name: name,
                    address: address,
                    phoneNumber: phone,
                    accountId: accountId,
                    status: 1,
                    longitude: longitude,
                    latitude: latitude
                }
            });
            if (!newAddress) {
                throw new Error("Tạo địa chỉ mới thất bại")
            }
            if (isDefault) {
                const updateDefaultAddress = await prisma.account.update({
                    where: {
                        id: accountId
                    },
                    data: {
                        defaultAddress: newAddress.id
                    }
                })
            }
            return newAddress;
        })
        
        return({
            message: "Tạo địa chỉ mới thành công",
            data: {
                addressData: createAddressTransaction,
                isDefault: isDefault
            },
            code: 0
        })
    } catch(e) {
        console.log(e);
        const message = e instanceof Error ? e.message : "Xảy ra lỗi ở service"
        return {...serviceError, message: message};
    }
}

export const getAllAddressService = async (accountId: number): Promise<ReturnData> => {
    try {
        const address = await prisma.address.findMany({
            where: {
                AND: [
                    {accountId: accountId},
                    {status: 1}
                ]
            },
            select: {
                id: true,
                name: true,
                phoneNumber: true,
                address: true,
                longitude: true,
                latitude: true
            }
        })
        const addressDefault = await prisma.account.findFirst({
            where: {
                id: accountId
            },
            select: {
                defaultAddress: true
            }
        })
        return({
            message: "Lấy dữ liệu thành công",
            data: {
                address: address,
                addressDefault: addressDefault?.defaultAddress
            },
            code: 0
        })
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const getAddressService = async (addressId: number, accountId: number): Promise<ReturnData> => {
    try {
        const [address, addressDefault] = await Promise.all([
            prisma.address.findFirst({
                where: {
                    AND: [
                        {id: addressId},
                        {status: 1}
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    phoneNumber: true,
                    address: true,
                    longitude: true,
                    latitude: true
                }
            }),
            prisma.account.findFirst({
                where: {
                    AND: [
                        {id: accountId},
                        {status: 1}
                    ]
                },
                select: {
                    defaultAddress: true
                }
            })
        ])
        if (!address) {
            return notFound;
        }
        return({
            message: "Tìm thông tin thành công",
            data: {
                address: address,
                isDefault: addressId == addressDefault?.defaultAddress
            },
            code: 0
        })
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const updateAddressService = async (addressId: number, accountId: number, name: string, phone: string, newAddress: string, isDefault: boolean, longitude: number, latitude: number): Promise<ReturnData> => {
    try {
        const afterAddress = await prisma.address.update({
            where: {id: addressId},
            data: {
                name: name,
                address: newAddress,
                phoneNumber: phone,
                longitude: longitude,
                latitude: latitude
            }
        })
        if (!afterAddress) {
            return notFound;
        }
        if (isDefault) {
            const updateAddressDefault = await prisma.account.update({
                where: {id: accountId},
                data: {
                    defaultAddress: addressId
                }
            })
        }
        return success("Cập nhật thành công", true);
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const deleteAddressService = async (accountId: number, idDelete: number[]): Promise<ReturnData> => {
    try {
        const account = await prisma.account.findFirst({
            where: {id: accountId},
            select: {
                defaultAddress: true
            }
        })
        if (!account) {
            return notFound;
        }
        if (idDelete.includes(account?.defaultAddress ?? -1)) {
            await prisma.account.update({
                where: {id: accountId},
                data: {
                    defaultAddress: null
                }
            })
        }
        await Promise.all(idDelete.map((item) => (
            prisma.address.update({
                where: {id: item},
                data: {
                    status: 0
                }
            })
        )))
        return success("Xóa thành công", true);
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const addFavouriteService = async (accountId: number, productId: number): Promise<ReturnData> => {
    try {
        const newFavourite = await prisma.favourite.create({
            data: {
                accountId: accountId,
                productId: productId
            }
        });
        if (!newFavourite) {
            return({
                message: "Lưu thất bại",
                code: 1,
                data: false
            })
        }
        return success("Lưu thành công", newFavourite);
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const deleteFavouriteService = async (accountId: number, productId: number, take: number): Promise<ReturnData> => {
    try {
        const now = new Date();
        const deleteFavourite = await prisma.favourite.deleteMany({
            where: {
                AND: [
                    {accountId: accountId},
                    {productId: productId}
                ]
            }
        })
        if (deleteFavourite.count == 0) {
            return notFound;
        }
        const createUserBehavior = await prisma.userBehavior.create({
            data: {
                accountId: accountId,
                productId: productId,
                behaviorType: 8,
                time: new Date(now)
            }
        })
        let nextFavourite = null;
        if (take != -1) {
            nextFavourite = await prisma.favourite.findMany({
                where: {
                    accountId: accountId
                },
                orderBy: {id: "desc"},
                skip: take - 1,
                take: 1,
                select: {
                    id: true,
                    product: {
                        select: productInfomation(now, accountId)
                    }
                }
            })
        }
        return success("Xóa thành công", nextFavourite);
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const getAllFavouriteService = async (accountId: number, page: number): Promise<ReturnData> => {
    try {
        const size = 8;
        const now = new Date();
        const favourite = await prisma.favourite.findMany({
            where: {
                accountId: accountId 
            },
            orderBy: {
                id: "desc"
            },
            skip: (page - 1) * size,
            take: size,
            select: {
                id: true,
                product: {
                    select: productInfomation(now, accountId)
                }
            }
        })
        let count: number = -1;
        if (page == 1) {
            count = await prisma.favourite.count({
                where: {
                    accountId: accountId
                }
            })
        }
        return success("Thành công", {count, favourite});
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const getAllHistoryService = async (accountId: number, page: number): Promise<ReturnData> => {
    try {
        const size = 8;
        const now = new Date();
        const history: {id: number}[] = await prisma.$queryRaw`
            select "id" from (
                select distinct on ("productId") "id", "viewDate"
                from "ViewHistory"
                where "accountId" = ${accountId}
                order by "productId", "viewDate" desc
            ) as distinctHistory
            order by "viewDate" desc
            offset ${(page - 1) * size}
            limit ${size}
        `
        const historyId = history.map((item) => (item.id))
        const rawHistory = await prisma.viewHistory.findMany({
            where: {
                id: {in: historyId}
            },
            orderBy: {
                viewDate: "desc"
            },
            select: {
                id: true,
                product: {
                    select: productInfomation(now, accountId)
                }
            }
        })
        let count: number = -1;
        if (page == 1) {
            const groupProduct = await prisma.viewHistory.groupBy({
                by: ["productId"],
                where: {accountId: accountId}
            })
            if (groupProduct.length > 0) {
                count = groupProduct.length
            }
        }
        return success("Thành công", {count, history: rawHistory});
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const addCartService = async (accountId: number, productId: number[], productVariantId: number[], quantity: number[], now: string): Promise<ReturnData> => {
    try {
        let existItem: any[] = []
        for (let i = 0; i < productId.length; i++) {
            const existVariant = await prisma.productVariant.findUnique({
                where: {
                    id: productVariantId[i]
                },
                select: {
                    status: true,
                    quantity: true,
                    product: {
                        select: {
                            name: true,
                            status: true
                        }
                    }
                }
            })
            if (!existVariant) {
                return({
                    message: `Sản phẩm đã bị ẩn`,
                    data: false,
                    code: 2
                })
            }
            if (existVariant && existVariant.status == 2) {
                return({
                    message: `Phân loại sản phẩm ${existVariant?.product?.name} đã bị ẩn`,
                    data: false,
                    code: 1
                })
            }
            if (existVariant && [2, 3].includes(existVariant.product?.status ?? -1)) {
                return({
                    message: `Sản phẩm ${existVariant?.product?.name} đã bị ẩn`,
                    data: false,
                    code: 1
                })
            }
            existItem = await prisma.shoppingCart.findMany({
                where: {
                    AND: [
                        {status: {in: [1, 3]}},
                        {accountId: accountId},
                        {productVariantId: productVariantId[i]}
                    ]
                },
                select: {
                    id: true,
                    quantity: true,
                    productVariant: {
                        select: {
                            quantity: true,
                            product: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            })

            if (existItem.length > 0) {
                const oldQuantity = existItem.reduce((sum, current) => (sum + current.quantity), 0)
                if (existItem[0].productVariant?.quantity && existItem[0].productVariant?.quantity < quantity[i] + oldQuantity) {
                    return({
                        message: `Số lượng sản phẩm ${existItem[0].productVariant.product.name} trong giỏ hàng vượt quá số lượng sản phẩm`,
                        data: false,
                        code: 1
                    })
                }
                const result = await prisma.$transaction(async (tx) => {
                    const newCartItem = await tx.shoppingCart.create({
                        data: {
                            accountId: accountId,
                            productVariantId: productVariantId[i],
                            quantity: quantity[i] + oldQuantity,
                            status: 1,
                            updateAt: new Date(now)
                        }
                    });

                    await Promise.all(
                        existItem.map(async (item) => (
                            await tx.shoppingCart.delete({
                                where: {id: item.id}
                            })
                        ))
                    )
                    const createUserBehavior = await tx.userBehavior.create({
                        data: {
                            accountId: accountId,
                            productId: productId[i],
                            behaviorType: 2,
                            time: new Date(now)
                        }
                    })
                })
            } else {
                const newCartItem = await prisma.shoppingCart.create({
                    data: {
                        accountId: accountId,
                        productVariantId: productVariantId[i],
                        quantity: quantity[i],
                        status: 1,
                        updateAt: new Date(now)
                    }
                })
                if (!newCartItem) {
                    return({
                        message: "Xảy ra lỗi khi thêm sản phẩm vào giỏ hàng",
                        data: false,
                        code: 1
                    })
                }
                const createUserBehavior = await prisma.userBehavior.create({
                    data: {
                        accountId: accountId,
                        productId: productId[i],
                        behaviorType: 2,
                        time: new Date(now)
                    }
                })
            }
        }
        
        return success("Thêm sản phẩm vào giỏ hàng thành công", existItem.length > 0 ? false : true);
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const getProductInCartService = async (accountId: number, page: number): Promise<ReturnData> => {
    try {
        const now = new Date();
        const size = 8;
        const rawProduct = await prisma.shoppingCart.findMany({
            where: {
                AND: [
                    {
                        status: {
                            in: [1, 3, 5]
                        }
                    },
                    {accountId: accountId}
                ]
                
            },
            orderBy: {id: "desc"},
            select: {
                id: true,
                quantity: true,
                status: true,
                productVariant: {
                    select: {
                        id: true,
                        size: true,
                        color: true,
                        price: true,
                        quantity: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                status: true,
                                category: {
                                    select: {
                                        id: true,
                                        parentId: true
                                    }
                                },
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
                                medias: {
                                    take: 1,
                                    select: {
                                        url: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            skip: (page - 1) * size,
            take: size
        })

        const product: CartProduct[] = rawProduct.map((item) => {
            const product = item.productVariant?.product;
            const variant = item.productVariant;
            const categories: string[] = ["shirt", "pant", "dress", "skirt"]
            const category = (product?.category.parentId ? product?.category.parentId : product?.category.id) ?? 0
            const percent = item.productVariant?.product?.productPromotions.find((item) => (item != null))?.promotion?.percent;
            const discount = (percent && variant?.price) ? (Math.round((variant.price * ((100 - percent) / 100)) / 1000) * 1000) : null
            
            return({
                productId: product?.id ?? -1, 
                productVariantId: variant?.id ?? -1,
                cartId: item.id,
                parentCategory: categories[category - 1],
                url: product?.medias[0].url ?? "",
                name: product?.name ?? "",
                price: variant?.price ?? -1,
                discount: discount,
                color: variant?.color ?? "",
                size: variant?.size ?? "",
                quantityOrder: item.quantity,
                quantity: variant?.quantity ?? -1,
                statusCart: item.status,
                statusProduct: product?.status ?? -1
            })
        })

        const count = await prisma.shoppingCart.count({
            where: {
                AND: [
                    {status: {in: [1, 3, 5]}},
                    {accountId: accountId}
                ]
            }
        })
        return success("Thành công", {product, count});
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const updateQuantityCartService = async (quantityCart: {cartId: number, quantityUpdate: number}[], now: string): Promise<ReturnData> => {
    try {
        let count = 0;
        for (const item of quantityCart) {
            const result = await prisma.shoppingCart.updateMany({
                where: {
                    AND: [
                        {status: 1},
                        {id: item.cartId}
                    ]
                },
                data: {
                    quantity: item.quantityUpdate,
                    updateAt: new Date(now)
                }
            })
            count += result.count
        }
        if (count == 0 && quantityCart.length > 0) {
            return({
                message: "Cập nhật số lượng trong giỏ hàng thất bại",
                data: false,
                code: 1
            })
        }
        return success("Thành công", true);
    } catch(e) {
        console.log(e);
        return serviceError
    }
}

export const deleteProductInCartService = async (cartId: number[], productId: number[], take: number, accountId: number, now: string): Promise<ReturnData> => {
    try {
        const deleteTransaction = await prisma.$transaction(async (tx) => {
            const deleteCart = await tx.shoppingCart.updateMany({
                where: {
                    id: {in: cartId}
                },
                data: {
                    status: 4,
                    updateAt: new Date(now)
                }
            })
            if (cartId.length != deleteCart.count) {
                throw new Error("Không xóa được sản phẩm trong giỏ hàng");
            }
            
            await Promise.all(
                productId.map(async (item) => {
                    return await tx.userBehavior.create({
                        data: {
                            accountId: accountId,
                            productId: item,
                            behaviorType: 7,
                            time: new Date(now)
                        }
                    })
                })
            )
            let product: CartProduct[] = []
            if (take == -1) {
                return product
            }

            const cartReplace = await tx.shoppingCart.findMany({
                where: {
                    AND: [
                        {status: {in: [1, 3, 5]}},
                        {accountId: accountId}
                    ]
                },
                orderBy: {
                    id: "desc"
                },
                skip: take - cartId.length,
                take: cartId.length,
                select: {
                    id: true,
                    quantity: true,
                    status: true,
                    productVariant: {
                        select: {
                            id: true,
                            size: true,
                            color: true,
                            price: true,
                            quantity: true,
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    status: true,
                                    category: {
                                        select: {
                                            id: true,
                                            parentId: true
                                        }
                                    },
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
                                    medias: {
                                        take: 1,
                                        select: {
                                            url: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })   
            product = cartReplace.map((item) => {
                const product = item.productVariant?.product;
                const variant = item.productVariant;
                const categories: string[] = ["shirt", "pant", "dress", "skirt"]
                const category = (product?.category.parentId ? product?.category.parentId : product?.category.id) ?? 0
                const percent = item.productVariant?.product?.productPromotions.find((item) => (item != null))?.promotion?.percent;
                
                return({
                    productId: product?.id ?? -1, 
                    productVariantId: variant?.id ?? -1,
                    cartId: item.id,
                    parentCategory: categories[category - 1],
                    url: product?.medias[0].url ?? "",
                    name: product?.name ?? "",
                    price: variant?.price ?? -1,
                    discount: percent ? Math.round((variant?.price ?? 0 * ((100 - percent) / 100)) / 1000) * 1000 : null,
                    color: variant?.color ?? "",
                    size: variant?.size ?? "",
                    quantityOrder: item.quantity,
                    quantity: variant?.quantity ?? -1,
                    statusCart: item.status,
                    statusProduct: product?.status ?? -1
                })
            })  
            return product      
        })
        
        const countCart = await prisma.shoppingCart.count({
            where: {
                AND: [
                    {accountId: accountId},
                    {status: {in: [1, 3, 5]}}
                ]
            }
        })
        return success("Đã xóa sản phẩm khỏi giỏ hàng", {product: deleteTransaction, count: countCart});
    } catch(e) {
        console.log(e);
        const message = e instanceof Error ? e.message : "Xảy ra lỗi ở service"
        return {...serviceError, message: message};
    }
}

export const getProductDetailModalService = async (accountId: number, productId: number): Promise<ReturnData> => {
    try {
        const now = new Date();
        const existProduct = await prisma.product.findMany({
            where: {
                AND: [
                    {id: productId},
                    {status: 1}
                ]
            },
            select: {id: true}
        })
        if (existProduct.length == 0) {
            return({
                message: "Không tìm thấy sản phẩm",
                data: false,
                code: 2
            })
        }
        const product = await prisma.product.findFirst({
            where: {
                AND: [
                    {id: productId},
                    {status: 1}
                ]
            },
            select: {
                id: true,
                name: true,
                description: true,
                rateStar: true,
                productVariants: {
                    select: {
                        id: true,
                        color: true,
                        size: true,
                        price: true,
                        quantity: true,
                        status: true
                    }
                },
                medias: {
                    select: {
                        url: true
                    }
                },
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
                favourites: {
                    where: {
                        accountId: accountId
                    },
                    select: {
                        id: true
                    }
                }
            }
        })
        let rate: any[] = [];
        const count = await prisma.feedback.count({
            where: {
                AND: [
                    {status: 1},
                    {
                        productVariant: {
                            productId: productId
                        }
                    }
                ]
            }
        })
        return success("Thành công", {product, rate, count});
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const updateVariantInCartService = async (cartId: number, accountId: number, variantId: number, quantity: number, now: string): Promise<ReturnData> => {
    try {
        const updated = await prisma.shoppingCart.updateManyAndReturn({
            where: {
                AND: [
                    {id: cartId},
                    {status: 1},
                    {accountId: accountId}
                ]
            },
            data: {
                productVariantId: variantId,
                quantity: quantity,
                updateAt: now
            },
            select: {
                id: true,
                productVariant: {
                    select: {
                        quantity: true,
                        price: true,
                        product: {
                            select: {
                                productPromotions: {
                                    select: {
                                        promotion: {
                                            select: {
                                                percent: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
        if (updated.length == 0) {
            return({
                message: "Cập nhật giỏ hàng thất bại",
                data: false,
                code: 1
            })
        }
        return success("Cập nhật giỏ hàng thành công", updated)
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const getAddressAndFeeService = async (accountId: number): Promise<ReturnData> => {
    try {
        const addressDefault = await prisma.account.findUnique({
            where: {
                id: accountId
            },
            select: {
                defaultAddress: true
            }
        })
        let address: {name: string, phoneNumber: string, address: string, longitude: number, latitude: number} | null = null;
        if (addressDefault?.defaultAddress) {
            address = await prisma.address.findUnique({
                where: {
                    id: addressDefault.defaultAddress
                },
                select: {
                    id: true,
                    name: true,
                    phoneNumber: true,
                    address: true,
                    longitude: true,
                    latitude: true
                }
            })
        } else {
            address = await prisma.address.findFirst({
                where: {
                    AND: [
                        {status: 1},
                        {accountId: accountId}
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    phoneNumber: true,
                    address: true,
                    longitude: true,
                    latitude: true
                }
            })
        }
        const shippingFee = await prisma.shippingFee.findMany({
            select: {
                id: true,
                maxDistance: true,
                minDistance: true,
                cost: true
            }
        })
        return success("Thành công", {address, shippingFee})
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const getVoucherService = async (accountId: number, productId: number[], totalPrice: number): Promise<ReturnData> => {
    try {
        const now = new Date();
        let billAndShipVoucher = await prisma.voucher.findMany({
            where: {
                AND: [
                    {startDate: {lte: now}},
                    {endDate: {gte: now}},
                    {status: 1},
                    {quantity: {gt: 0}},
                    {condition: {lte: totalPrice}},
                    {type: {in: [1, 2]}}
                ]
            },
            select: {
                id: true,
                code: true,
                discountPercent: true,
                startDate: true,
                endDate: true,
                name: true,
                description: true,
                type: true,
                condition: true
            }
        })

        let categoryVoucher: any[] = [];
        for (const item of productId) {
            const result = await prisma.voucher.findMany({
                where: {
                    AND: [
                        {startDate: {lte: now}},
                        {endDate: {gte: now}},
                        {status: 1},
                        {quantity: {gt: 0}},
                        {condition: {lte: totalPrice}},
                        {type: {in: [3]}},
                        {
                            // Chọn category (con lẫn cha) có chứa sản phẩm có id = item
                            // Sau đó chọn voucher có chứa category vừa tìm được
                            voucherCategories: {
                                some: {
                                    category: {
                                        OR: [
                                            {
                                                products: {
                                                    some: {id: item}
                                                }
                                            },
                                            {
                                                children: {
                                                    some: {
                                                        products: {
                                                            some: {id: item}
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                },
                select: {
                    id: true,
                    code: true,
                    discountPercent: true,
                    startDate: true,
                    endDate: true,
                    name: true,
                    description: true,
                    type: true,
                    condition: true
                }
            })
            if (result.length > 0) {
                categoryVoucher = [...categoryVoucher, {productId: item, voucher: [...result]}]
            }
        }
        const voucherUsed = await prisma.order.findMany({
            where: {
                AND: [
                    {accountId: accountId},
                    {currentStatus: {not: 1}},
                ]
            },
            include: {
                orderVouchers: {
                    select: {
                        voucherId: true
                    }
                }
            }
        })
        const voucherUsedId = voucherUsed.flatMap((item) => (item.orderVouchers.map((itemChild) => (itemChild.voucherId))))
        billAndShipVoucher = billAndShipVoucher.filter((item) => (!voucherUsedId.includes(item.id)))
        categoryVoucher = categoryVoucher.map((item) => ({
            productId: item.productId, 
            voucher: item.voucher.filter((itemChild: any) => (!voucherUsedId.includes(itemChild.id)))
        }))
        return success("success", {billAndShipVoucher, categoryVoucher});
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

// Kiểm tra: variant, product tồn tại, số lượng variant phải đủ
export const orderProductService = async (
    accountId: number, productOrder: CartProduct[], address: AddressInformation,
    totalPrice: number, orderDate: string, note: string, voucherUse: VoucherUse, 
    shippingFeeId: number, paymentMethod: number, finalPrice: number
): Promise<ReturnData> => {
    try {
        const orderTransaction = await prisma.$transaction(async (tx) => {
            let addressId = address.id;
            if (addressId == -1) {
                const createAddress = await tx.address.create({
                    data: {
                        address: address.address,
                        name: address.name,
                        phoneNumber: address.phone,
                        longitude: address.longitude,
                        latitude: address.latitude,
                        accountId: accountId,
                        status: 1
                    }
                })
                addressId = createAddress.id;
            }
            const order = await tx.order.create({
                data: {
                    accountId: accountId,
                    addressId: addressId,
                    total: totalPrice,
                    orderDate: new Date(orderDate),
                    currentStatus: 2,
                    note: note
                }
            })
            const createOrderStatusHistory = await tx.orderStatusHistory.create({
                data: {
                    orderId: order.id,
                    statusId: 2,
                    date: new Date(orderDate),
                }
            })
            const createBill = await tx.bill.create({
                data: {
                    orderId: order.id,
                    shippingFeeId: shippingFeeId,
                    status: paymentMethod == 1 ? 1 : 0,
                    paymentMethod: paymentMethod,
                    paymentTime: paymentMethod == 1 ? new Date(orderDate) : null,
                    total: finalPrice
                }
            })
            const orderDetailArray: {id: number, productVariantId: number | null, orderId: number | null, quantity: number}[] = []
            for (const item of productOrder) {
                const updateProductVariant = await tx.productVariant.updateManyAndReturn({
                    where: {
                        AND: [
                            {id: item.productVariantId},
                            {status: 1},
                            {quantity: {gte: item.quantityOrder}},
                        ]
                    },
                    data: {
                        quantity: {decrement: item.quantityOrder}
                    }
                })
                if (updateProductVariant.length == 0) {
                    throw new Error(`Sản phẩm ${item.name} hiện không thể đặt hàng`)
                } else {
                    if (updateProductVariant[0].quantity == 0) {
                        const updateProductStatus = await tx.$executeRaw`
                            update "Product" as p
                            set status = 3
                            where p.id = ${item.productId} and not exists (
                                select 1
                                from "ProductVariant" as v
                                where v."productId" = p.id and v.quantity > 0
                            )
                        `
                    }
                }
                const createOrderDetail = await tx.orderDetail.create({
                    data: {
                        productVariantId: item.productVariantId,
                        orderId: order.id,
                        quantity: item.quantityOrder
                    }
                })
                orderDetailArray.push(createOrderDetail);
                const createUserBehavior = await tx.userBehavior.create({
                    data: {
                        accountId: accountId,
                        productId: item.productId,
                        behaviorType: 3,
                        time: new Date(orderDate)
                    }
                })
            } 
            const cartId = productOrder.map((item) => (item.cartId)).filter(Boolean);
            if (cartId.length > 0) {
                const updateCart = await tx.shoppingCart.updateMany({
                    where: {
                        id: {in: cartId}
                    },
                    data: {
                        status: 2,
                        updateAt: new Date(orderDate)
                    }
                })
            } 
            if (voucherUse.shipVoucher) {
                const updateVoucher = await tx.voucher.updateMany({
                    where: {
                        AND: [
                            {id: voucherUse.shipVoucher.voucherId},
                            {quantity: {gt: 0}},
                            {status: 1},
                            {startDate: {lte: new Date(orderDate)}},
                            {endDate: {gte: new Date(orderDate)}}
                        ]
                    },
                    data: {
                        quantity: {decrement: 1}
                    }
                })
                if (updateVoucher.count == 0) {
                    throw new Error(`Không thể sử dụng voucher ${voucherUse.shipVoucher.voucherCode}`)
                }
                const createShipVoucher = await tx.orderVoucher.create({
                    data: {
                        orderId: order.id,
                        voucherId: voucherUse.shipVoucher.voucherId
                    }
                })
                
            }
            if (voucherUse.productVoucher) {
                const updateVoucher = await tx.voucher.updateMany({
                    where: {
                        AND: [
                            {id: voucherUse.productVoucher.voucherId},
                            {quantity: {gt: 0}},
                            {status: 1},
                            {startDate: {lte: new Date(orderDate)}},
                            {endDate: {gte: new Date(orderDate)}}
                        ]
                    },
                    data: {
                        quantity: {decrement: 1}
                    }
                })
                if (updateVoucher.count == 0) {
                    throw new Error(`Không thể sử dụng voucher ${voucherUse.productVoucher.voucherCode}`)
                }
                const createProductVoucher = await tx.orderVoucher.create({
                    data: {
                        orderId: order.id,
                        voucherId: voucherUse.productVoucher.voucherId
                    }
                })
                if (voucherUse.productVoucher.productId.length > 0) {
                    const productVariant = await tx.product.findMany({
                        where: {
                            id: {in: voucherUse.productVoucher.productId}
                        },
                        select: {
                            productVariants: {
                                select: {
                                    id: true
                                }
                            }
                        }
                    })
                    const productVariantId = productVariant.flatMap((item) => (item.productVariants.map((itemChild) => (itemChild.id))))
                    for (const item of orderDetailArray) {
                        if (productVariantId.includes(item.productVariantId ?? -1)) {
                            const createVoucherOrderDetail = await tx.voucherOrderDetail.create({
                                data: {
                                    voucherId: voucherUse.productVoucher.voucherId,
                                    orderDetailId: item.id
                                }
                            })
                        }
                    }
                }
            }
        })
        return success("Đặt hàng thành công", true);
    } catch(e) {
        console.log(e);
        if (e instanceof Error) {
            return({
                message: e.message,
                data: false,
                code: 1
            })
        } else {
            return serviceError
        }
    }
}

export const getOrderListService = async (accountId: number, status: number[], page: number): Promise<ReturnData> => {
    try {
        const size = 3;
        const order = await prisma.order.findMany({
            where: {
                AND: [
                    {accountId: accountId},
                    {currentStatus: {in: status}}
                ]
            },
            orderBy: {
                id: "desc"
            },
            skip: (page - 1) * size,
            take: size,
            select: {
                id: true,
                orderDate: true,
                currentStatus: true,
                orderStatusHistories: {
                    select: {
                        id: true,
                        statusId: true,
                        date: true
                    }
                },
                bills: {
                    select: {
                        status: true,
                        total: true,
                        paymentTime: true,
                        paymentMethod: true
                    }
                },
                orderDetails: {
                    select: {
                        productVariant: {
                            select: {
                                id: true,
                                size: true,
                                color: true,
                                price: true,
                                product: {
                                    select: {
                                        id: true,
                                        name: true, 
                                        productPromotions: {
                                            select: {
                                                promotion: {
                                                    select: {
                                                        percent: true
                                                    }
                                                }
                                            }
                                        },
                                        medias: {
                                            select: {
                                                url: true
                                            },
                                            take: 1
                                        }
                                    }
                                }
                            }
                        },
                        quantity: true
                    }
                }
            }
        })
        const countOrder = await prisma.order.count({
            where: {
                AND: [
                    {accountId: accountId},
                    {currentStatus: {in: status}}
                ]
            }
        })
        const orderProcess: OrderData[] = order.map((item) => {
            const price = item.orderDetails.map((itemChild) => (itemChild.productVariant?.price ?? -1))
            const promotion = item.orderDetails.map((itemChild) => (itemChild.productVariant?.product?.productPromotions))
            const percent = promotion.map((itemChild) => (itemChild && itemChild.length > 0 ? itemChild[0].promotion?.percent ?? 0 : 0))
            return({
                status: item.currentStatus ?? -1,
                id: item.id,
                orderDate: dayjs(item.orderDate).format("DD/MM/YYYY HH:mm"),
                productId: item.orderDetails.map((itemChild) => (itemChild.productVariant?.product?.id ?? -1)),
                productVariantId: item.orderDetails.map((itemChild) => (itemChild.productVariant?.id ?? -1)),
                url: item.orderDetails.map((itemChild) => (itemChild.productVariant?.product?.medias[0].url ?? "")),
                name: item.orderDetails.map((itemChild) => (itemChild.productVariant?.product?.name ?? "")),
                price: price,
                discount: percent.map((itemChild, indexChild) => (itemChild > 0 ? Math.round((price[indexChild] * ((100 - itemChild) / 100)) / 1000) * 1000 : 0)),
                size: item.orderDetails.map((itemChild) => (itemChild.productVariant?.size ?? "")),
                color: item.orderDetails.map((itemChild) => (itemChild.productVariant?.color ?? "")),
                quantity: item.orderDetails.map((itemChild) => (itemChild.quantity)),
                total: item.bills[0].total,
                paymentTime: item.bills[0].paymentTime ? dayjs(item.bills[0].paymentTime).format("DD/MM/YYYY HH:mm") : null,
                paymentMethod: item.bills[0].paymentMethod,
                statusHistory: item.orderStatusHistories.map((itemChild) => (
                    {
                        id: itemChild.id,
                        status: itemChild.statusId ?? -1,
                        date: itemChild.date
                    }
                ))
            })
        })
        return success("Thành công", {order: orderProcess, count: countOrder});
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const getOrderDetailService = async (accountId: number, orderId: number): Promise<ReturnData> => {
    try {
        const orderDetailRaw = await prisma.order.findUnique({
            where: {
                id: orderId
            },
            select: {
                id: true,
                orderDate: true,
                currentStatus: true,
                note: true,
                total: true,
                address: {
                    select: {
                        name: true,
                        phoneNumber: true,
                        address: true
                    }
                },
                orderStatusHistories: {
                    select: {
                        id: true,
                        statusId: true,
                        date: true,
                        note: true,
                    }
                },
                orderVouchers: {
                    select: {
                        voucher: {
                            select: {
                                discountPercent: true,
                                type: true
                            }
                        }
                    }
                },
                bills: {
                    select: {
                        shippingFee: {
                            select: {
                                cost: true
                            }
                        },
                        status: true,
                        total: true,
                        paymentTime: true,
                        paymentMethod: true
                    }
                },
                orderDetails: {
                    select: {
                        productVariant: {
                            select: {
                                id: true,
                                size: true,
                                color: true,
                                price: true,
                                product: {
                                    select: {
                                        id: true,
                                        name: true, 
                                        productPromotions: {
                                            select: {
                                                promotion: {
                                                    select: {
                                                        percent: true
                                                    }
                                                }
                                            }
                                        },
                                        medias: {
                                            select: {
                                                url: true
                                            },
                                            take: 1
                                        }
                                    }
                                },
                                feedbacks: {
                                    where: {
                                        AND: [
                                            {accountId: accountId},
                                            {status: 1}
                                        ]
                                    },
                                    select: {
                                        star: true
                                    }
                                }
                            }
                        },
                        voucherOrderDetails: {
                            select: {
                                voucherCategory: {
                                    select: {
                                        voucherId: true
                                    }
                                }
                            }
                        },
                        quantity: true
                    }
                }
            }
        })

        if (!orderDetailRaw) {
            return notFound;
        }

        const address: {name: string, phoneNumber: string, address: string} = orderDetailRaw.address;
        const orderStatusHistories: {id: number, note: string | null, statusId: number | null, date: Date}[]= orderDetailRaw.orderStatusHistories;
        const orderVouchers: {
            voucher: {type: number, discountPercent: number} | null
        }[] = orderDetailRaw.orderVouchers;
        const bills: {
            total: number, status: number, paymentMethod: number, paymentTime: Date | null, 
            shippingFee: {cost: number} | null
        } = orderDetailRaw.bills[0];
        const orderDetails = orderDetailRaw.orderDetails;

        const price = orderDetails.map((item) => (item.productVariant?.price ?? -1))
        const promotion = orderDetails.map((item) => (item.productVariant?.product?.productPromotions))
        const percent = promotion.map((item) => (item && item.length > 0 ? item[0].promotion?.percent ?? 0 : 0))
        const discount = percent.map((item, index) => (item > 0 ? Math.round((price[index] * ((100 - item) / 100)) / 1000) * 1000 : 0))
        const quantity = orderDetails.map((item) => (item.quantity))

        const shippingFee = bills.shippingFee?.cost ?? 0;
        let shipDiscount = 0;
        let productDiscount = 0;
        if (orderVouchers.length > 0) {
            for (const item of orderVouchers) {
                if (item.voucher) {
                    if (item.voucher.type == 2) {
                        const shipPercent = item.voucher.discountPercent;
                        shipDiscount = Math.round(((shipPercent * shippingFee) / 100) / 1000) * 1000;
                    } else {
                        const productPercent = item.voucher.discountPercent;
                        const typeProductVoucher = item.voucher.type;
                        if (item.voucher.type == 1) {
                            productDiscount = Math.round(((productPercent * orderDetailRaw.total) / 100) / 1000) * 1000;
                        }
                        if (item.voucher.type == 3) {
                            let totalPriceDiscount = 0;
                            for (let i = 0; i < orderDetails.length; i++) {
                                if (orderDetails[i].voucherOrderDetails.length > 0) {
                                    totalPriceDiscount = totalPriceDiscount + (discount[i] > 0 ? discount[i] : price[i])
                                }
                            }
                            productDiscount = Math.round(((productPercent * totalPriceDiscount) / 100) / 1000) * 1000;
                        }
                    }
                }
            }
        }
        const processData: OrderDetailData = {
            overallData: {
                status: orderDetailRaw.currentStatus ?? -1,
                id: orderDetailRaw.id,
                orderDate: dayjs(orderDetailRaw.orderDate).format("DD/MM/YYYY HH:mm"),
                productId: orderDetails.map((item) => (item.productVariant?.product?.id ?? -1)),
                productVariantId: orderDetails.map((item) => (item.productVariant?.id ?? -1)),
                url: orderDetails.map((item) => (item.productVariant?.product?.medias[0].url ?? "")),
                name: orderDetails.map((item) => (item.productVariant?.product?.name ?? "")),
                price: price,
                discount: discount,
                size: orderDetails.map((item) => (item.productVariant?.size ?? "")),
                color: orderDetails.map((item) => (item.productVariant?.color ?? "")),
                quantity: quantity,
                total: bills.total,
                paymentTime: bills.paymentTime ? dayjs(bills.paymentTime).format("DD/MM/YYYY HH:mm") : null,
                paymentMethod: bills.paymentMethod,
                statusHistory: orderStatusHistories.map((item) => (
                    {
                        id: item.id,
                        status: item.statusId ?? -1,
                        date: item.date
                    }
                ))   
            },
            star: orderDetails.map((item) => {
                const feedbacks = item.productVariant?.feedbacks;
                if (feedbacks && feedbacks.length > 0) {
                    return feedbacks[0].star
                } else {
                    return null
                }
            }),
            paymentStatus: bills.status,
            orderNote: orderDetailRaw.note,
            returnReason: orderDetailRaw.currentStatus == 5 ? orderStatusHistories.find((item) => (item.statusId == 5))?.note ?? null : null,
            cancelReason: orderDetailRaw.currentStatus == 1 ? orderStatusHistories.find((item) => (item.statusId == 1))?.note ?? null : null,
            address: address,
            shippingFee: shippingFee,
            shipDiscount: shipDiscount,
            productDiscount: productDiscount
        }
        return success("Thành cồng", processData)
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const confirmReceiveProductService = async (orderId: number, now: string): Promise<ReturnData> => {
    try {
        const updateTransaction = await prisma.$transaction(async (tx) => {
            const updateOrder = await tx.order.update({
                where: {id: orderId},
                data: {
                    currentStatus: 6
                }
            })
            if (!updateOrder) {
                throw new Error("Không thể cập nhật trạng thái đơn hàng");
            }
            const createNewStatus = await tx.orderStatusHistory.create({
                data: {
                    orderId: orderId,
                    statusId: 6,
                    date: new Date(now)
                }
            })
            if (!createNewStatus) {
                throw new Error("Không thể lưu lịch sử trạng thái của đơn hàng");
            }
        })
        return success("Xác nhận thành công", true);
    } catch(e) {
        console.log(e);
        if (e instanceof Error) {
            return({
                message: e.message,
                code: 1,
                data: false
            })
        }
        return serviceError
    }
}

export const returnProductService = async (orderId: number, take: number, now: string, accountId: number, status: number[], reason: string, mode: string, productId: number[], productVariantId: number[], quantityOrder: number[]): Promise<ReturnData> => {
    try {
        const size = 3;
        let nextRecord: OrderData[] = [];
        if (take != -1) {
            const nextPage = take + 1
            const order = await prisma.order.findMany({
                where: {
                    AND: [
                        {accountId: accountId},
                        {currentStatus: {in: status}}
                    ]
                },
                orderBy: {
                    id: "desc"
                },
                skip: (nextPage - 1) * size,
                take: 1,
                select: {
                    id: true,
                    orderDate: true,
                    currentStatus: true,
                    orderStatusHistories: {
                        select: {
                            id: true,
                            statusId: true,
                            date: true
                        }
                    },
                    bills: {
                        select: {
                            status: true,
                            total: true,
                            paymentTime: true,
                            paymentMethod: true
                        }
                    },
                    orderDetails: {
                        select: {
                            productVariant: {
                                select: {
                                    id: true,
                                    size: true,
                                    color: true,
                                    price: true,
                                    product: {
                                        select: {
                                            id: true,
                                            name: true, 
                                            productPromotions: {
                                                select: {
                                                    promotion: {
                                                        select: {
                                                            percent: true
                                                        }
                                                    }
                                                }
                                            },
                                            medias: {
                                                select: {
                                                    url: true
                                                },
                                                take: 1
                                            }
                                        }
                                    }
                                }
                            },
                            quantity: true
                        }
                    }
                }
            })
            nextRecord = order.map((item) => {
                const price = item.orderDetails.map((itemChild) => (itemChild.productVariant?.price ?? -1))
                const promotion = item.orderDetails.map((itemChild) => (itemChild.productVariant?.product?.productPromotions))
                const percent = promotion.map((itemChild) => (itemChild && itemChild.length > 0 ? itemChild[0].promotion?.percent ?? 0 : 0))
                return({
                    status: item.currentStatus ?? -1,
                    id: item.id,
                    orderDate: dayjs(item.orderDate).format("DD/MM/YYYY HH:mm"),
                    productId: item.orderDetails.map((itemChild) => (itemChild.productVariant?.product?.id ?? -1)),
                    productVariantId: item.orderDetails.map((itemChild) => (itemChild.productVariant?.id ?? -1)),
                    url: item.orderDetails.map((itemChild) => (itemChild.productVariant?.product?.medias[0].url ?? "")),
                    name: item.orderDetails.map((itemChild) => (itemChild.productVariant?.product?.name ?? "")),
                    price: price,
                    discount: percent.map((itemChild, indexChild) => (itemChild > 0 ? Math.round((price[indexChild] * ((100 - itemChild) / 100)) / 1000) * 1000 : 0)),
                    size: item.orderDetails.map((itemChild) => (itemChild.productVariant?.size ?? "")),
                    color: item.orderDetails.map((itemChild) => (itemChild.productVariant?.color ?? "")),
                    quantity: item.orderDetails.map((itemChild) => (itemChild.quantity)),
                    total: item.bills[0].total,
                    paymentTime: item.bills[0].paymentTime ? dayjs(item.bills[0].paymentTime).format("DD/MM/YYYY HH:mm") : null,
                    paymentMethod: item.bills[0].paymentMethod,
                    statusHistory: item.orderStatusHistories.map((itemChild) => (
                        {
                            id: itemChild.id,
                            status: itemChild.statusId ?? -1,
                            date: itemChild.date
                        }
                    ))
                })
            })
        }

        const updateOrderTransaction = await prisma.$transaction(async (tx) => {
            const updateOrder = await tx.order.update({
                where: {id: orderId},
                data: {
                    currentStatus: mode == "return" ? 5 : 1
                }
            })

            if (!updateOrder) {
                throw new Error("Không thể cập nhật trạng thái đơn hàng")
            }

            const createHistoryStatus = await tx.orderStatusHistory.create({
                data: {
                    orderId: orderId,
                    statusId: mode == "return" ? 5 : 1,
                    date: new Date(now),
                    note: reason
                }
            })

            if (!createHistoryStatus) {
                throw new Error("Không thể tạo lịch sử trạng thái đơn hàng");
            }

            for (const item of productId) {
                const createUserBehavior = await tx.userBehavior.create({
                    data: {
                        accountId: accountId,
                        productId: item,
                        behaviorType: 9,
                        time: new Date(now)
                    }
                })

                if (!createUserBehavior) {
                    throw new Error("Không thể thêm hành vi người dùng");
                }

                const updateStatusProduct = await tx.product.updateMany({
                    where: {
                        AND: [
                            {id: item},
                            {status: 3}
                        ]
                    },
                    data: {
                        status: 1
                    }
                })
            }
            
            for (let i = 0; i < productVariantId.length; i++) {
                const updateVariant = await tx.productVariant.updateMany({
                    where: {
                        AND: [
                            {id: productVariantId[i]}
                        ]
                    },
                    data: {
                        quantity: {increment: quantityOrder[i]}
                    }
                })
                if (updateVariant.count == 0) {
                    throw new Error("Không thể cập nhật số lượng sản phẩm")
                }
            }
        })
        return success(`${mode == "return" ? "Trả hàng" : "Hủy đơn"} thành công`, nextRecord);
    } catch(e) {
        console.log(e);
        if (e instanceof Error) {
            return({
                message: e.message,
                data: false,
                code: 1
            })
        }
        return serviceError;
    }
}