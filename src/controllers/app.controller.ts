import { Request, Response } from "express";
import { ReturnData } from "../interfaces/app.interface";
import { googleLoginService } from "../services/app.service";

export const googleLoginController = async (req: Request, res: Response): Promise<any> => {
    try {
        const {userInformation} = req.body;
        if (!userInformation) {
            return res.status(200).json({
                message: "Không nhận được dữ liệu",
                code: 1,
                data: false
            })
        }
        const result: ReturnData = await googleLoginService(userInformation);
        return res.status(200).json({
            message: result.message,
            code: result.code,
            data: result.data
        })
    } catch(e) {
        console.log(e);
        return res.status(500).json({
            message: "Xảy ra lỗi ở controller",
            data: false,
            code: -1
        })
    }
}