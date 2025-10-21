import { compare, genSalt, hash } from "bcrypt-ts";
import { GoogleUser, notFound, prisma, productInfomation, ReturnData, serviceError, SessionValue, success } from "../interfaces/app.interface";
import { createSession, verifyIdToken } from "../middleware/jwt";
import { sendEmail } from "../configs/email";
import { redis } from "../configs/redis";
import { Prisma } from "@prisma/client";

//Phải chuyển dữ liệu datetime về dạng string ở format "YYYY-MM-DDTHH:mm:ss" hoặc iso string ở fe để gửi lên be, sau đó ở be chuyển thành Date và lưu db
//dob.toLocaleString("vi-VN"): Lệnh này để chuyển dữ liệu kiểu datetime lấy từ db về dạng ngày tháng năm thời gian

export const googleLoginService = async (userInformation: GoogleUser): Promise<ReturnData> => {
    try {
        const result: SessionValue = await verifyIdToken(userInformation.idToken);
        if (result.accountId == -1) {
            return({
                message: "Đăng nhập thất bại",
                code: 1,
                data: false
            })
        }
        const sessionKey = await createSession({
            accountId: result.accountId,
            roleId: result.roleId,
            googleLogin: result.googleLogin
        })
        return({
            message: "Đăng nhập thành công",
            code: 0,
            data: {
                id: result.accountId,
                roleId: result.roleId,
                googleLogin: result.googleLogin,
                sessionKey: sessionKey
            }
        })
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const normalLoginService = async (email: string, password: string): Promise<ReturnData> => {
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
        const sessionValue: SessionValue = {
            accountId: existAccount.id,
            roleId: existAccount.roleId ?? -1,
            googleLogin: existAccount.isLoginGoogle == 1 ? true : false
        }
        const sessionKey = await createSession(sessionValue);
        return({
            message: "Đăng nhập thành công",
            code: 0,
            data: {
                id: existAccount.id,
                roleId: existAccount.roleId,
                googleLogin: existAccount.isLoginGoogle == 1 ? true : false,
                sessionKey: sessionKey
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
            select: {
                ...productInfomation(now),
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
                select: {
                    ...productInfomation(now),
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
        } else {
            const productCategoryObject: {id: number}[] = await prisma.product.findMany({
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
                select: {
                    id: true
                }
            })
            const productCategoryArray = productCategoryObject.map((item) => (item.id));
            let priceProduct: {productId: number, minPrice: number}[] 
            if (productCategoryArray.length == 0) {
                priceProduct = await prisma.$queryRaw`
                    SELECT "productId", MIN("price") AS "minPrice"
                    FROM "ProductVariant"
                    WHERE "productId" IS NOT NULL
                    GROUP BY "productId";
                `
            } else {
                priceProduct = await prisma.$queryRaw`
                    SELECT "productId", MIN("price") AS "minPrice"
                    FROM "ProductVariant"
                    WHERE "productId" IS NOT NULL AND "productId" IN (${Prisma.join(productCategoryArray)})
                    GROUP BY "productId";
                `
            }
            const productResult: number[] = priceProduct.sort((a, b) => (sort == 2 ? a.minPrice - b.minPrice : b.minPrice - a.minPrice)).slice((page - 1) * size, page * size).map((item) => (item.productId));
            product = await prisma.product.findMany({
                where: {
                    id: {
                        in: productResult
                    }
                },
                select: {
                    ...productInfomation(now),
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
            product = product.sort((a, b) => (sort == 2 ? a.productVariants[0].price - b.productVariants[0].price : b.productVariants[0].price - a.productVariants[0].price))
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