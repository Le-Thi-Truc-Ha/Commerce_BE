import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express, { Application } from "express";
import configCors from "./configs/cors";
import initWebRoute from "./routes/web.route";
import cron from "node-cron";
import axios from "axios";

dotenv.config();

const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app: Application = express();

configCors(app);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

initWebRoute(app);

// Phút Giờ Ngày Tháng Thứ (3:00 mỗi ngày)
cron.schedule("0 3 * * *", async () => {
    try {
        await Promise.all([
            axios.get(process.env.CONFIRM_RECEIVE_URL || ""),
            axios.get(process.env.TRAIN_LIGHTFM_URL || "")
        ]);
    } catch(e) {
        console.log(e);
    }
}, {
    timezone: "Asia/Ho_Chi_Minh"
})

app.listen(port, () => {
    console.log("Backend is running on the port: " + port);
});