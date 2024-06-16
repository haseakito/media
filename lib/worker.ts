import { Job } from "bullmq";
import { sendVerificationEmail } from "./resend";

/**
 *
 */
export const emailProcessors = {
  sendVerificationEmail: async (job: Job) => {
    const { name, email, verificationCode } = job.data;
    await sendVerificationEmail({ name, email, verificationCode });
  },
  sendPasswordResetEmail: async (job: Job) => {},
};
