import { compare, genSalt, hash } from "bcrypt-ts";
import { prisma, ReturnData } from "../interfaces/app.interface";
import { UserInformation } from "../interfaces/customer.interface";

const serviceError: ReturnData = {
    message: "Xảy ra lỗi ở service",
    data: false,
    code: -1
}
const notFound: ReturnData = {
    message: "Không tìm thấy dữ liệu",
    data: false,
    code: 1
}
const success = (message: string, data: any) => {
    return({
        message: message,
        data: data,
        code: 0
    })
}

const getAccountInformationService = async (accountId: number): Promise<ReturnData> => {
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

const saveAccountInformationService = async (accountId: number, name: string, email: string, dob: string | null, gender: string | null): Promise<ReturnData> => {
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

const savePasswordService = async (accountId: number, oldPassword: string, newPassword: string): Promise<ReturnData> => {
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

export default {
    getAccountInformationService, saveAccountInformationService, savePasswordService
}