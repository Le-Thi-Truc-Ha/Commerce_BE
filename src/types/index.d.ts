import { SessionValue } from "../interfaces/app.interface";

declare global {
    namespace Express {
        interface Request {
            user?: SessionValue | null;
            sessionKey?: string;
        }
    }
}

export {};