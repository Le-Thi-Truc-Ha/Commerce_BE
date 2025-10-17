import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express, { Application } from "express";
import configCors from "./configs/cors";
import initWebRoute from "./routes/web.route";

dotenv.config();

const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app: Application = express();

configCors(app);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

initWebRoute(app);

app.listen(port, () => {
    console.log("Backend is running on the port: " + port);
});