import { compare } from "bcrypt-ts";
import { GoogleUser, prisma, ReturnData, SessionValue } from "../interfaces/app.interface";
import { createSession, verifyIdToken } from "../middleware/jwt";
import { sendEmail } from "../configs/email";

export const googleLoginService = async (userInformation: GoogleUser): Promise<ReturnData> => {
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
        
        const otp = Array.from({length: 5}, () => {
            return Math.floor(Math.random() * 10)
        }).join("");
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