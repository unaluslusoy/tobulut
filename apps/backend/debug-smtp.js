require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const mailOptions = {
        from: `"To Bulut Debug" <${process.env.MAIL_FROM}>`, 
        to: "unaluslusoy@todestek.net",
        subject: "SMTP Debug Test - Gmail",
        text: "Using Nodemailer with Gmail SMTP. Verification Success!",
        html: "<b>Using Nodemailer with Gmail SMTP. Verification Success!</b>"
    };

    try {
        console.log(`Sending email from ${process.env.SMTP_USER} via ${process.env.SMTP_HOST}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

testEmail();
