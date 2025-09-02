import dotenv from "dotenv";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { PayloadData, prisma } from "../interfaces/app.interface";
import admin from "../configs/firebase";

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

export const verifyToken = (token: string): PayloadData => {
    const key: Secret = (process.env.JWT_SECRET || "OTHERCOMMERCE2025");
    const decoded = jwt.verify(token, key);
    if (typeof decoded == "string") {
        throw new Error("Token không hợp lệ")
    }
    return {
        id: decoded.id,
        roleId: decoded.roleId,
        googleLogin: decoded.googleLogin
    };
}

export const verifyIdToken = async (idToken: string): Promise<PayloadData> => {
    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        const user = await admin.auth().getUser(decoded.uid);
        const existAccount = await prisma.account.findFirst({
            where: {
                AND: [
                    {email: decoded.email},
                    {status: 1}
                ]
            },
            select: {
                id: true,
                roleId: true,
                isLoginGoogle: true
            }
        });
        if (existAccount) {
            return({
                id: existAccount.id,
                roleId: existAccount.roleId ?? -1,
                googleLogin: existAccount.isLoginGoogle == 1 ? true : false
            })
        } else {
            const createAccount = await prisma.account.create({
                data: {
                    fullName: user.displayName ?? "",
                    email: decoded.email ?? "",
                    status: 1,
                    roleId: 2,
                    isLoginGoogle: 1
                }
            });
            return({
                id: createAccount.id,
                roleId: createAccount.roleId ?? -1,
                googleLogin: true
            })
        }
    } catch(e) {
        console.log(e);
        return({
            id: -1,
            roleId: -1,
            googleLogin: false
        })
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