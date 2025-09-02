import { GoogleUser, PayloadData, prisma, ReturnData } from "../interfaces/app.interface";
import { createJWT, verifyIdToken } from "../middleware/jwt";

export const googleLoginService = async (userInformation: GoogleUser): Promise<ReturnData> => {
    try {
        const result: PayloadData = await verifyIdToken(userInformation.idToken);
        if (result.id == -1) {
            return({
                message: "Đăng nhập thất bại",
                code: 1,
                data: false
            })
        }
        return({
            message: "Đăng nhập thành công",
            code: 0,
            data: {
                id: result.id,
                token: createJWT({
                    id: result.id,
                    roleId: result.roleId,
                    googleLogin: true
                })
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