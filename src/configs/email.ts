import nodemailer from 'nodemailer';
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.KEY_MAIL
    }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const info = await transporter.sendMail({
            from: "E - Commerce",
            to: to,
            subject: subject,
            html: html
        })
    } catch(e) {
        console.log(e);
    }
}