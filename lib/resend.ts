import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

interface sendVerificationEmailProps {
  name: string;
  email: string;
  verificationCode: string;
}