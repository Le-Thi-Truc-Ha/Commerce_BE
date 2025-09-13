import { compare, genSalt, hash } from "bcrypt-ts";
import { GoogleUser, prisma, ReturnData, SessionValue } from "../interfaces/app.interface";
import { createSession, verifyIdToken } from "../middleware/jwt";
import { sendEmail } from "../configs/email";
import { redis } from "../configs/redis";

//Phải chuyển dữ liệu datetime về dạng iso string ở fe để gửi lên be, sau đó ở be chuyển thành Date và lưu db
//dob.toLocaleString("vi-VN"): Lệnh này để chuyển dữ liệu kiểu datetime lấy từ db về dạng ngày tháng năm thời gian
const googleLoginService = async (userInformation: GoogleUser): Promise<ReturnData> => {
    try {
        const result: SessionValue = await verifyIdToken(userInformation.idToken);
        if (result.id == -1) {
            return({
                message: "Đăng nhập thất bại",
                code: 1,
                data: false
            })
        }
        const sessionKey = await createSession({
            id: result.id,
            roleId: result.roleId,
            googleLogin: result.googleLogin
        })
        return({
            message: "Đăng nhập thành công",
            code: 0,
            data: {
                id: result.id,
                roleId: result.roleId,
                googleLogin: result.googleLogin,
                sessionKey: sessionKey
            }
        })
    } catch(e) {
        console.log(e);
        return({
            message: "Xảy ra lỗi ở service",
            code: -1,
            data: false
        })
    }
}

const normalLoginService = async (email: string, password: string): Promise<ReturnData> => {
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
            id: existAccount.id,
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
        return({
            message: "Xảy ra lỗi ở service",
            code: -1,
            data: false
        })
    }
}

const checkEmailService = async (email: string): Promise<ReturnData> => {
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
        return({
            message: "Xảy ra lỗi ở service",
            code: -1,
            data: false
        })
    }
}

const checkOtpService = async (email: string, otp: string): Promise<ReturnData> => {
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
        return({
            message: "Xảy ra lỗi ở service",
            code: -1,
            data: false
        })
    }
}

const resetPasswordService = async (email: string, newPassword: string): Promise<ReturnData> => {
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
        return({
            message: "Xảy ra lỗi ở service",
            code: -1,
            data: false
        })
    }
}

const verifyEmailService = async (email: string): Promise<ReturnData> => {
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

const createAccountService = async (
    otp: string, email: string, name: string, phone: string | null, 
    dob: string | null, gender: string | null, password: string
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
                phoneNumber: phone,
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
        return({
            message: "Xảy ra lỗi ở service",
            code: -1,
            data: false
        })
    }
}

export default {
    googleLoginService, normalLoginService, checkEmailService, checkOtpService,
    resetPasswordService, verifyEmailService, createAccountService
}