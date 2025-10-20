import { compare, genSalt, hash } from "bcrypt-ts";
import { notFound, prisma, ReturnData, serviceError, success } from "../interfaces/app.interface";
import { UserInformation } from "../interfaces/customer.interface";

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

export const createAddressService = async (accountId: number, name: string, phone: string, address: string, isDefault: boolean): Promise<ReturnData> => {
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
        const newAddress = await prisma.address.create({
            data: {
                name: name,
                address: address,
                phoneNumber: phone,
                accountId: accountId,
                status: 1
            }
        });
        if (!newAddress) {
            return({
                message: "Tạo địa chỉ mới thất bại",
                data: false,
                code: 1
            })
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
        return({
            message: "Tạo địa chỉ mới thành công",
            data: {
                addressData: newAddress,
                isDefault: isDefault
            },
            code: 0
        })
    } catch(e) {
        console.log(e);
        return serviceError;
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
                address: true
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
                    address: true
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

export const updateAddressService = async (addressId: number, accountId: number, name: string, phone: string, newAddress: string, isDefault: boolean): Promise<ReturnData> => {
    try {
        const afterAddress = await prisma.address.update({
            where: {id: addressId},
            data: {
                name: name,
                address: newAddress,
                phoneNumber: phone
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
                    id: 0
                }
            })
        )))
        return success("Xóa thành công", true);
    } catch(e) {
        console.log(e);
        return serviceError;
    }
}

export const addFavouriteService = async (accountId: number, productId: number, now: string, seen: boolean): Promise<ReturnData> => {
    try {
        const newFavourite = await prisma.viewHistory.create({
            data: {
                accountId: accountId,
                productId: productId,
                viewDate: new Date(now),
                isLike: seen ? 3 : 1
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