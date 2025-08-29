import dotenv from "dotenv";
import jwt, { Secret } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { PayloadData, prisma } from "../interfaces/app";

dotenv.config();

export const createJWT = (payload: PayloadData): any => {
    try {
        const key: Secret = (process.env.JWT_SECRET || "OTHERCOMMERCE2025");
        const token: string = jwt.sign(payload, key, {expiresIn: "1d"});
        return token;
    } catch(e) {
        console.log(e);
    }
}

export const verifyToken = (token: string) => {
    try {
        const key: Secret = (process.env.JWT_SECRET || "OTHERCOMMERCE2025");
        const decoded = jwt.verify(token, key);
        return decoded;
    } catch(e) {
        console.log(e);
    }
}

export const checkLogin = (req: Request, res: Response, next: NextFunction): any => {
    const token = req.cookies?.token;
    if (!token) {
        res.status(200).json({
            message: "Bạn chưa đăng nhập",
            data: false,
            code: 1,
        });
        return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        res.status(200).json({
            message: "Token không hợp lệ",
            data: false,
            code: 1
        });
        return;
    }

    req.user = decoded;
    req.token = token;

    next();
}

export const getPermission = async (roleId: number) => {
    try {
        const permissions = await prisma.permission.findMany({
            where: {roleId: roleId},
            select: {
                url: true
            }
        })
        return permissions ? permissions : [];
    } catch(e) {
        console.log(e);
    }
}

export const checkPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.user && typeof req.user !== "string") {
        const permissions = await getPermission(req.user.roleId);

        if (permissions?.length == 0 || !permissions) {
            res.status(200).json({
                message: "Không có quyền truy cập",
                data: false,
                code: 1
            });
            return;
        }

        let currentPath = req.path;

        if (req.user.roleId == 1) {
            currentPath = "/admin" + currentPath;
        } else if (req.user.roleId == 2) {
            currentPath = "/customer" + currentPath;
        }

        let canAccess = permissions.some((item) => (item?.url == currentPath))
        if (canAccess) {
            next();
        } else {
            res.status(200).json({
                message: "Không có quyền truy cập",
                data: false,
                code: 1
            });
            return;
        }
    } else {
        res.status(200).json({
            message: "Không thể xác thực người dùng",
            data: false,
            code: 1
        });
        return;
    }
}