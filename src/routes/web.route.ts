import { Application } from "express";
import appRoute from "./app.route";
import adminRoute from "./admin.route";
import customerRoute from "./customer.route";

let initWebRoute = (app: Application): void => {
    app.use("/", appRoute);
    app.use("/admin", adminRoute);
    app.use("/customer", customerRoute);
}

export default initWebRoute;