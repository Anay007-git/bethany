import nodemailer from 'nodemailer';

console.log("Testing SMTP credentials...");

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "53619394da4d93",
        pass: "4fe03e61cbf8ec"
    }
});

async function main() {
    try {
        const info = await transporter.sendMail({
            from: '"Test" <info@bethanyhomestay.com>',
            to: "biswasanay07@gmail.com",
            subject: "Test Verification Email",
            text: "This is a test email to verify the SMTP credentials directly from a local Node script."
        });
        console.log("✅ Success! Email sent. Message ID:", info.messageId);
    } catch (error) {
        console.error("❌ Failed to send email.");
        console.error(error);
    }
}

main();
