import { compare, genSalt, hash } from "bcrypt-ts";
import { notFound, prisma, productInfomation, ReturnData, serviceError, success } from "../interfaces/app.interface";
import { CartProduct, UserInformation } from "../interfaces/customer.interface";

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
        const checkPassword = await compare(oldPassword, account.password ?? "");
        if (!checkPassword) {
            return({
                message: "Mật khẩu cũ không đúng",
                data: false,
                code: 1
            })
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

export const addCartService = async (accountId: number, productVariantId: number, quantity: number, now: string): Promise<ReturnData> => {
    try {
        const existVariant = await prisma.productVariant.findMany({
            where: {
                AND: [
                    {id: productVariantId},
                    {product: {
                        status: 1
                    }}
                ]
            }
        })
        if (existVariant.length == 0) {
            return({
                message: "Sản phẩm đã bị ẩn",
                data: false,
                code: 2
            })
        }
        const existItem = await prisma.shoppingCart.findMany({
            where: {
                AND: [
                    {status: {in: [1, 3]}},
                    {accountId: accountId},
                    {productVariantId: productVariantId}
                ]
            },
            select: {
                id: true,
                quantity: true,
                productVariant: {
                    select: {
                        quantity: true
                    }
                }
            }
        })

        if (existItem.length > 0) {
            const oldQuantity = existItem.reduce((sum, current) => (sum + current.quantity), 0)
            if (existItem[0].productVariant?.quantity && existItem[0].productVariant?.quantity < quantity + oldQuantity) {
                return({
                    message: "Số lượng sản phẩm trong giỏ hàng vượt quá số lượng sản phẩm",
                    data: false,
                    code: 1
                })
            }
            const result = await prisma.$transaction(async (tx) => {
                const newCartItem = await tx.shoppingCart.create({
                    data: {
                        accountId: accountId,
                        productVariantId: productVariantId,
                        quantity: quantity + oldQuantity,
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
                return newCartItem
            })
        } else {
            const newCartItem = await prisma.shoppingCart.create({
                data: {
                    accountId: accountId,
                    productVariantId: productVariantId,
                    quantity: quantity,
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
                status: {in: [1, 3, 5]}
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

export const deleteProductInCartService = async (cartId: number[], take: number, accoutId: number, now: string): Promise<ReturnData> => {
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

            let product: CartProduct[] = []
            if (take == -1) {
                return product
            }

            const cartReplace = await tx.shoppingCart.findMany({
                where: {
                    AND: [
                        {status: {in: [1, 3, 5]}},
                        {accountId: accoutId}
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
                    {accountId: accoutId},
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
        // console.dir(categoryVoucher, {depth: null});
        // const voucherId = [...billAndShipVoucher.map((item) => (item.id)), ...categoryVoucher.flatMap((item) => (item.voucher.map((itemChild: any) => (itemChild.id))))]
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