import { Job } from "bullmq";
import { sendPasswordResetEmail, sendVerificationEmail } from "./resend";

export const emailProcessors = {
  /**
   * Sends a verification email to a user
   *
   * @param job The job containing the user data
   */
  sendVerificationEmail: async (job: Job) => {
    const { name, email, verificationCode } = job.data;
    await sendVerificationEmail({ name, email, verificationCode });
  },

  /**
   * Sends a password reset email to a user
   *
   * @param job The job containing the user data
   */
  sendPasswordResetEmail: async (job: Job) => {
    const { name, email, verificationToken } = job.data;
    await sendPasswordResetEmail({ name, email, verificationToken });
  },
};
