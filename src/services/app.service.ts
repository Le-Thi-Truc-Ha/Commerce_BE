import { GoogleUser, prisma, ReturnData } from "../interfaces/app.interface";
import { verifyIdToken } from "../middleware/jwt";

export const googleLoginService = async (userInformation: GoogleUser): Promise<ReturnData> => {
    try {
        verifyIdToken(userInformation.idToken);
        return({
            message: "Xảy ra lỗi ở service",
            code: -1,
            data: "abcd"
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