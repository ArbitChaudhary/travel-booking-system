import nodemailer from "nodemailer";
interface SendMailProps {
  to: string;
  subject?: string;
  text: string;
  html?: string;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "voidarbeet@gmail.com",
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

export const sendMail = async ({ to, subject, text, html }: SendMailProps) => {
  try {
    await transporter.sendMail({
      from: "voidarbeet@gmail.com",
      to,
      subject: subject,
      text,
      html,
    });
  } catch (error) {
    return error;
  }
};
