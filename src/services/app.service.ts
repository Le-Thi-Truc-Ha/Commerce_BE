import { compare, genSalt, hash } from "bcrypt-ts";
import { GoogleUser, notFound, prisma, productInfomation, ReturnData, serviceError, SessionValue, success } from "../interfaces/app.interface";
import { createSession, verifyIdToken } from "../middleware/jwt";
import { sendEmail } from "../configs/email";
import { redis } from "../configs/redis";
import { Prisma } from "@prisma/client";
import { v1 as uuidv1 } from "uuid"; 
import dayjs from "dayjs";
import axios from "axios";

//Phải chuyển dữ liệu datetime về dạng string ở format "YYYY-MM-DDTHH:mm:ss" hoặc iso string ở fe để gửi lên be, sau đó ở be chuyển thành Date và lưu db
//dob.toLocaleString("vi-VN"): Lệnh này để chuyển dữ liệu kiểu datetime lấy từ db về dạng ngày tháng năm thời gian

// Bật extension unaccent (tìm kiếm không phân biệt dấu, hoa thường) của postgreSQL
// CREATE EXTENSION IF NOT EXISTS unaccent;
// SELECT * FROM pg_extension WHERE extname = 'unaccent';

export const reloadPageService = async (accountId: number): Promise<ReturnData> => {
    try {
        const countCart = await prisma.shoppingCart.count({
            where: {
                AND: [
                    {accountId: accountId},
                    {status: {in: [1, 3]}}
                ]
            }
        })
        return success("Thành công", countCart);
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const googleLoginService = async (userInformation: GoogleUser, keyBeforeLogin: string | undefined): Promise<ReturnData> => {
    try {
        const result: SessionValue = await verifyIdToken(userInformation.idToken);
        if (result.accountId == -1) {
            return({
                message: "Đăng nhập thất bại",
                code: 1,
                data: false
            })
        }

        if (keyBeforeLogin) {
            const updateHistory = await prisma.viewHistory.updateMany({
                where: {
                    uuid: keyBeforeLogin
                },
                data: {
                    accountId: result.accountId
                }
            })
            const updateUserBehavior = await prisma.userBehavior.updateMany({
                where: {
                    uuid: keyBeforeLogin
                },
                data: {
                    accountId: result.accountId
                }
            })
            await redis.del(keyBeforeLogin)
        }

        const sessionKey = await createSession({
            accountId: result.accountId,
            roleId: result.roleId,
            googleLogin: result.googleLogin
        })

        const countCart = await prisma.shoppingCart.count({
            where: {
                AND: [
                    {accountId: result.accountId},
                    {status: {in: [1, 3]}}
                ]
            }
        })
        return({
            message: "Đăng nhập thành công",
            code: 0,
            data: {
                id: result.accountId,
                roleId: result.roleId,
                googleLogin: result.googleLogin,
                sessionKey: sessionKey,
                cart: countCart
            }
        })
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const normalLoginService = async (email: string, password: string, keyBeforeLogin: string | undefined): Promise<ReturnData> => {
    try {
        const existAccount = await prisma.account.findFirst({
            where: {
                AND: [
                    {email: email},
                    {status: 1}
                ]
            },
            select: {
                id: true,
                password: true,
                roleId: true,
                isLoginGoogle: true
            }
        });
        if (!existAccount) {
            return({
                message: "Tài khoản không tồn tại",
                code: 1,
                data: false
            })
        }
        const checkPassword = await compare(password, existAccount.password ?? "");
        if (!checkPassword) {
            return({
                message: "Sai mật khẩu",
                code: 1,
                data: false
            })
        }
        if (keyBeforeLogin) {
            const updateHistory = await prisma.viewHistory.updateMany({
                where: {
                    uuid: keyBeforeLogin
                },
                data: {
                    accountId: existAccount.id
                }
            })
            const updateUserBehavior = await prisma.userBehavior.updateMany({
                where: {
                    uuid: keyBeforeLogin
                },
                data: {
                    accountId: existAccount.id
                }
            })
            await redis.del(keyBeforeLogin)
        }
        const sessionValue: SessionValue = {
            accountId: existAccount.id,
            roleId: existAccount.roleId ?? -1,
            googleLogin: existAccount.isLoginGoogle == 1 ? true : false
        }
        const sessionKey = await createSession(sessionValue);

        const countCart = await prisma.shoppingCart.count({
            where: {
                AND: [
                    {accountId: existAccount.id},
                    {status: {in: [1, 3]}}
                ]
            }
        })
        return({
            message: "Đăng nhập thành công",
            code: 0,
            data: {
                id: existAccount.id,
                roleId: existAccount.roleId,
                googleLogin: existAccount.isLoginGoogle == 1 ? true : false,
                sessionKey: sessionKey,
                cart: countCart
            }
        })
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const checkEmailService = async (email: string): Promise<ReturnData> => {
    try {
        const existAccount = await prisma.account.findFirst({
            where: {
                AND: [
                    {email: email},
                    {status: 1}
                ]
            }
        })
        if (!existAccount) {
            return({
                message: "Tài khoản không tồn tại",
                data: false,
                code: 1
            })
        }
        const existOtp = await redis.get(`otp:${email}`);
        if (existOtp) {
            const ttl = await redis.ttl(`otp:${email}`);
            const expiry = Date.now() + ttl * 1000;
            return({
                message: "Mã xác thực đã được gửi, vui lòng kiểm tra email",
                data: expiry,
                code: 2
            })
        }
        const otp = Array.from({length: 5}, () => {
            return Math.floor(Math.random() * 10)
        }).join("");

        await redis.set(`otp:${email}`, otp, "EX", 60 * 3);
        
        const expiry = Date.now() + 60 * 3 * 1000;

        await sendEmail(
            email,
            "Mã Xác Thực",
            `
                Mã xác thực của bạn là: ${otp}
            `
        )
        return({
            message: "Thành công",
            code: 0,
            data: expiry
        })
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const checkOtpService = async (email: string, otp: string): Promise<ReturnData> => {
    try {
        const otpAuth = await redis.get(`otp:${email}`);
        if (!otpAuth) {
            return({
                message: "Không tìm thấy mã xác thực",
                data: false,
                code: 1
            })
        }
        if (otp != otpAuth) {
            return({
                message: "Mã xác thực không đúng",
                data: false,
                code: 1
            })
        }
        return({
            message: "Chính xác",
            code: 0,
            data: true
        })
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const resetPasswordService = async (email: string, newPassword: string): Promise<ReturnData> => {
    try {
        const salt = await genSalt(10);
        const hashPassword = await hash(newPassword, salt);

        const updatePassword = await prisma.account.update({
            where: {email: email},
            data: {
                password: hashPassword
            }
        })
        if (!updatePassword) {
            return({
                message: "Đổi mật khẩu thất bại",
                code: 1,
                data: false
            })
        }
        return({
            message: "Đổi mật khẩu thành công",
            code: 0,
            data: true
        })
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const verifyEmailService = async (email: string): Promise<ReturnData> => {
    try {
        const existAccount = await prisma.account.findFirst({
            where: {
                AND: [
                    {email: email},
                    {status: 1}
                ]
            },
            select: {id: true}
        })
        if (existAccount) {
            return({
                message: "Email đã được sử dụng để đăng ký tài khoản",
                code: 1,
                data: false
            })
        }
        const existOtp = await redis.get(`otp:${email}`);
        if (existOtp) {
            const ttl = await redis.ttl(`otp:${email}`);
            const expiry = Date.now() + ttl * 1000;
            return({
                message: "Mã xác thực đã được gửi, vui lòng kiểm tra email",
                data: expiry,
                code: 2
            })
        }
        const otp = Array.from({length: 5}, () => {
            return Math.floor(Math.random() * 10)
        }).join("");

        await redis.set(`otp:${email}`, otp, "EX", 60 * 3);
        
        const expiry = Date.now() + 60 * 3 * 1000;

        await sendEmail(
            email,
            "Mã Xác Thực",
            `
                Mã xác thực của bạn là: ${otp}
            `
        )
        return({
            message: "Thành công",
            code: 0,
            data: expiry
        })
    } catch(e: any) {
        console.log(e);
        let message = "Xảy ra lỗi ở service";
        if (e.code == "EENVELOPE") {
            message = "Không tìm thấy email"
        }
        const existOtp = await redis.get(`otp:${email}`);
        if (existOtp) {
            redis.del(`otp:${email}`)
        }
        return({
            message: message,
            code: -1,
            data: false
        })
    }
}

export const createAccountService = async (
    otp: string, email: string, name: string, dob: string | null, 
    gender: string | null, password: string
): Promise<ReturnData> => {
    try {
        const otpAuth = await redis.get(`otp:${email}`);
        if (otp != otpAuth) {
            return({
                message: "Mã xác thực không đúng",
                code: 1,
                data: false
            })
        }
        const salt = await genSalt(10);
        const hashPassword = await hash(password, salt);
        const newAccount = await prisma.account.create({
            data: {
                email: email,
                fullName: name,
                dob: dob && new Date(dob),
                gender: gender,
                password: hashPassword,
                status: 1,
                isLoginGoogle: 0,
                roleId: 2
            }
        })
        return({
            message: "Tạo tài khoản thành công",
            code: 0,
            data: newAccount
        })
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const getBestSellerService = async (accountId: number): Promise<ReturnData> => {
    try {
        const now = new Date();
        const production = await prisma.product.findMany({
            where: {
                status: 1
            },
            orderBy: {
                saleFigure: "desc"
            },
            take: 8,
            select: productInfomation(now, accountId)
        })
        if (production.length == 0) {
            return notFound;
        }
        return success("Lấy dữ liệu thành công", production);
    } catch(e) {
        console.log(e);
        return serviceError
    }
}

export const getProductService = async (accountId: number, category: number, sort: number, page: number): Promise<ReturnData> => {
    try {
        const size = 12;
        const now = new Date();
        let product: any[];
        if (sort == 0 || sort == 1) {
            product = await prisma.product.findMany({
                where: category == 0 ? {
                    status: 1
                } : {
                    AND: [
                        {status: 1},
                        {
                            OR: [
                                {
                                    category: {
                                        id: category
                                    }
                                },
                                {
                                    category: {
                                        parentId: category
                                    }
                                }
                            ]
                        }
                    ]
                },
                orderBy: sort == 0 ? {id: "desc"} : {saleFigure: "desc"},
                skip: (page - 1) * size,
                take: size,
                select: productInfomation(now, accountId)
            })
        } else {
            const sortCondition = sort == 2 ? Prisma.sql`asc` : Prisma.sql`desc`
            const categoryCondition = category == 0 ? Prisma.sql``: Prisma.sql`and c."parentId" = ${category} or c.id = ${category}`
            const productSelect: {id: number}[] = await prisma.$queryRaw`
                select p.id
                from "Product" as p
                join "ProductVariant" as v on v."productId" = p.id
                join "Categories" as c on c.id = p."categoryId"
                where p.status = 1 and v.status = 1 ${categoryCondition} 
                group by p.id
                order by min(v.price) ${sortCondition}
                offset ${(page - 1) * size}
                limit ${size}
            `

            const productId = productSelect.map((item) => (item.id))
            product = await Promise.all(
                productId.map(async (item) => (
                    await prisma.product.findUnique({
                        where: {id: item},
                        select: productInfomation(now, accountId)
                    })
                ))
            )
            product = product.sort((a, b) => (productId.indexOf(a.id) - productId.indexOf(b.id)))
        }
        let count = 0;
        if (page == 1) {
            count = await prisma.product.count({
                where: category == 0 ? {
                    status: 1
                } : {
                    AND: [
                        {status: 1},
                        {
                            category: {
                                OR: [
                                    {id: category},
                                    {parentId: category}
                                ]
                            }
                        }
                    ]
                }
            })
        }
        return success("Thành công", {product, count})
    } catch(e) {
        console.log(e);
        return serviceError
    }
}

export const getProductDetailService = async (accountId: number, productId: number, pageRate: number): Promise<ReturnData> => {
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
        const rateSize = 3;
        const rate = await prisma.feedback.findMany({
            where: {
                AND: [
                    {status: 1},
                    {
                        productVariant: {
                            productId: productId
                        }
                    }
                ]
            },
            orderBy: {
                id: "asc"
            },
            skip: (pageRate - 1) * rateSize,
            take: rateSize,
            select: {
                id: true,
                feeedbackDate: true,
                star: true,
                content: true,
                account: {
                    select: {
                        id: true,
                        email: true
                    }
                },
                productVariant: {
                    select: {
                        id: true,
                        size: true,
                        color: true
                    }
                },
                medias: {
                    select: {
                        url: true,
                        type: true
                    }
                }
            }
        })
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

export const saveHistoryService = async (accountId: number, productId: number, now: string, keyBeforeLogin: string | undefined): Promise<ReturnData> => {
    try {
        if (accountId != -1) {
            const saveAccountHistory = await prisma.viewHistory.create({
                data: {
                    accountId: accountId,
                    productId: productId,
                    viewDate: new Date(now),
                }
            })
            const saveAccountBehavior = await prisma.userBehavior.create({
                data: {
                    accountId: accountId,
                    productId: productId,
                    time: new Date(now),
                    behaviorType: 6
                }
            })
            return success("Thành công", true)
        } else {
            let uuid = keyBeforeLogin;
            if (!uuid) {
                uuid = uuidv1();
                await redis.set(uuid, JSON.stringify({accountId: -1, roleId: 2, googleLogin: false}), "EX", 60*60*24*30);
            }
            const saveUuidHistory = await prisma.viewHistory.create({
                data: {
                    productId: productId,
                    uuid: uuid,
                    viewDate: new Date(now),
                }
            })
            const saveUuidBehavior = await prisma.userBehavior.create({
                data: {
                    productId: productId,
                    uuid: uuid,
                    time: new Date(now),
                    behaviorType: 6
                }
            })
            return success("Thành công", uuid)
        }
    } catch(e) {
        console.log(e);
        return serviceError
    }
}

export const checkUpdateCartService = async (cartId: number): Promise<ReturnData> => {
    try {
        const currentUpdate = await prisma.shoppingCart.findUnique({
            where: {
                id: cartId
            },
            select: {
                updateAt: true
            }
        })
        if (!currentUpdate) {
            return notFound
        }
        return success("Thành công", currentUpdate)
    } catch(e) {
        console.log(e);
        return serviceError
    }
}

export const findValueService = async (findValue: string, productId: number[] | null, page: number, accountId: number, keyBeforeLogin: string | undefined): Promise<ReturnData> => {
    try {
        // ts_rank: Tính mức độ giống nhau giữa chuỗi đầu vào và chuỗi trong csdl
        // to_tsvector: Hàm tách các từ trong văn bản
        // unaccent: Loại bỏ dấu
        // coalese(a, b): Nếu a là null thì lấy b, nếu a khác null thì lấy a
        // ||' '||: Phép nối chuỗi trong sql
        // string_agg(a, ' '): Nối tất cả các giá trị của cột a có cùng giá trị tại cột được group by và phân cách bằng ' ' (dấu cách)
        // plainto_tsquery: Tách chuỗi tìm kiếm thành các từ, nó sẽ có dạng từ 1 & từ 2..., nghĩa là chuỗi trong csdl phải chứa tất cả các từ này thì kết quả đó mới được lấy
        // a @@ b phép so sánh giữa hai chuỗi, trong truy vấn này thì phép so sánh sẽ trả về true nếu tất cả các từ trong b có trong a
        let existProductId = productId;
        let uuid = keyBeforeLogin;
        if (!existProductId) {
            const products: {id: number, rank: number}[] = await prisma.$queryRaw`
                select 
                    p.id,
                    ts_rank(
                        to_tsvector('simple', unaccent(
                            'san pham do' || ' ' ||
                            coalesce(p.name, '') || ' ' || 
                            coalesce(p.description, '') || ' ' ||
                            'lien than' || ' ' || coalesce(string_agg(f.fit, ' '), '') || ' ' ||
                            'chat lieu vai lam bang' || ' ' || coalesce(string_agg(f.material, ' '), '') || ' ' ||
                            'mac trong muc dich' || ' ' || coalesce(string_agg(f.occasion, ' '), '') || ' ' ||
                            'mua' || ' ' || coalesce(string_agg(f.season, ' '), '') || ' ' ||
                            'mau' || ' ' || coalesce(string_agg(f.color, ' '), '') || ' ' ||
                            'kich thuoc size' || ' ' || coalesce(string_agg(f.size, ' '), '') || ' ' ||
                            'style xu huong kieu loai' || ' ' || coalesce(string_agg(f.style, ' '), '') || ' ' ||
                            'cho nguoi tuoi' || ' ' || coalesce(string_agg(f.age, ''), '')
                        )),
                        plainto_tsquery('simple', unaccent(${findValue}))
                    ) as rank
                from "Product" as p
                left join "ProductFeature" as f on f."productId" = p.id
                group by p.id, p.name, p.description
                having to_tsvector('simple', unaccent(
                    'san pham do' || ' ' ||
                    coalesce(p.name, '') || ' ' || 
                    coalesce(p.description, '') || ' ' ||
                    'lien than' || ' ' || coalesce(string_agg(f.fit, ' '), '') || ' ' ||
                    'chat lieu vai lam bang' || ' ' || coalesce(string_agg(f.material, ' '), '') || ' ' ||
                    'mac trong muc dich' || ' ' || coalesce(string_agg(f.occasion, ' '), '') || ' ' ||
                    'mua' || ' ' || coalesce(string_agg(f.season, ' '), '') || ' ' ||
                    'mau' || ' ' || coalesce(string_agg(f.color, ' '), '') || ' ' ||
                    'kich thuoc size' || ' ' || coalesce(string_agg(f.size, ' '), '') || ' ' ||
                    'style xu huong kieu loai' || ' ' || coalesce(string_agg(f.style, ' '), '') || ' ' ||
                    'cho nguoi tuoi' || ' ' || coalesce(string_agg(f.age, ''), '')
                )) @@ plainto_tsquery('simple', unaccent(${findValue})) and p.status = 1
                order by rank desc;
            `;
            const now = new Date();
            existProductId = products.map((item) => (item.id));
            if (accountId != -1) {
                await Promise.all(
                    existProductId.map(async (item) => {
                        return await prisma.userBehavior.create({
                            data: {
                                accountId: accountId,
                                productId: item,
                                behaviorType: 10,
                                time: now
                            }
                        })
                    })
                )
            } else {
                if (!uuid) {
                    uuid = uuidv1();
                    await redis.set(uuid, JSON.stringify({accountId: -1, roleId: 2, googleLogin: false}), "EX", 60*60*24*30);
                }
                await Promise.all(
                    existProductId.map(async (item) => {
                        return await prisma.userBehavior.create({
                            data: {
                                uuid: uuid,
                                productId: item,
                                behaviorType: 10,
                                time: now
                            }
                        })
                    })
                )
            }
        }

        const size = 20;
        const productIdInPage = existProductId.length > size ? existProductId?.slice((page - 1) * size, page * size) : existProductId
        const now = new Date();
        const productInPage: any[] = [];
        for (const item of productIdInPage) {
            const result = await prisma.product.findUnique({
                where: {id: item},
                select: productInfomation(now, accountId)
            })
            if (result) {
                productInPage.push(result);
            }
        }
        return success("Thành công", {product: productInPage, productId: existProductId, uuid: uuid})
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const getRateService = async (productId: number, filter: number, page: number): Promise<ReturnData> => {
    try {
        const rateSize = 3;
        const rate = await prisma.feedback.findMany({
            where: {
                AND: filter == 0 ? [
                    {status: 1},
                    {
                        productVariant: {
                            productId: productId
                        }
                    }
                ] : [
                    {status: 1},
                    {star: filter},
                    {
                        productVariant: {
                            productId: productId
                        }
                    }
                ]
            },
            orderBy: {
                id: "asc"
            },
            skip: (page - 1) * rateSize,
            take: rateSize,
            select: {
                id: true,
                feeedbackDate: true,
                star: true,
                content: true,
                account: {
                    select: {
                        id: true,
                        email: true
                    }
                },
                productVariant: {
                    select: {
                        id: true,
                        size: true,
                        color: true
                    }
                },
                medias: {
                    select: {
                        url: true,
                        type: true
                    }
                }
            }
        })
        const count = await prisma.feedback.count({
            where: {
                AND: filter == 0 ? [
                    {status: 1},
                    {
                        productVariant: {
                            productId: productId
                        }
                    }
                ] : [
                    {status: 1},
                    {star: filter},
                    {
                        productVariant: {
                            productId: productId
                        }
                    }
                ]
            }
        })
        return success("Thành công", {rate, count});
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const confirmReceiveProductService = async (): Promise<ReturnData> => {
    try {
        const orderNotConfirm = await prisma.order.findMany({
            where: {
                currentStatus: 4
            },
            select: {
                id: true,
                orderDate: true
            }
        })
        const orderHaveConfirmId: number[] = [];
        for (const item of orderNotConfirm) {
            const threeNextDay = dayjs(item.orderDate).add(3, "day")
            if (threeNextDay.isBefore(dayjs(), "day") || threeNextDay.isSame(dayjs(), "day")) {
                orderHaveConfirmId.push(item.id)
            }
        }
        const updateTransaction = await prisma.$transaction(async (tx) => {
            const updateOrder = await tx.order.updateMany({
                where: {id: {in: orderHaveConfirmId}},
                data: {
                    currentStatus: 6
                }
            })
            if (updateOrder.count == 0 && orderHaveConfirmId.length != 0) {
                throw new Error("Không thể cập nhật trạng thái đơn hàng");
            }
            const createHistory = await Promise.all(
                orderHaveConfirmId.map(async (item) => (
                    await tx.orderStatusHistory.create({
                        data: {
                            orderId: item,
                            statusId: 6,
                            date: new Date()
                        }
                    })
                ))
            )
            if (createHistory.length == 0 && orderHaveConfirmId.length != 0) {
                throw new Error("Xảy ra lỗi khi lưu lịch sử trạng thái đơn hàng")
            }
        })
        return serviceError;
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

// export const svdService = async (): Promise<ReturnData> => {
//     try {
//         const data = "ABCD";
//         const callFastAPI = await axios.post("http://127.0.0.1:8000/rs/", {
//             data
//         })
//         console.log(callFastAPI.data);
//         return serviceError
//     } catch(e) {
//         console.log(e);
//         return serviceError;
//     }
// }