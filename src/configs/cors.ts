import cors from "cors";
import dotenv from "dotenv";
import { Application } from "express";

dotenv.config();
const configCors = (app: Application) => {
    app.use(cors({
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true
    }));
};

export default configCors;