import { Resend } from "resend";
import VerifyEmailTemplate from "@/emails/verify-email";

export const resend = new Resend(process.env.RESEND_API_KEY);

interface sendVerificationEmailProps {
  name: string;
  email: string;
  verificationCode: string;
}

export const sendVerificationEmail = async ({
  name,
  email,
  verificationCode,
}: sendVerificationEmailProps) => {
  // Create a new email verification link
  const verificationLink = `http://${process.env.NEXT_PUBLIC_API_URL}/auth/verify?token=${verificationCode}`;

  // Send a email verification email
  try {
    await resend.emails.send({
      from: "noreply@hackgame.biz",
      to: [email],
      subject: "Verify your email",
      react: VerifyEmailTemplate({ name, verificationLink }),
      headers: {
        "X-Entity-Ref-ID": new Date().getTime() + "",
      },
    });
  } catch (error) {
    console.log("Error while sending an email: ", error);
  }
};
