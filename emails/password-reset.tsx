import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Tailwind,
  Text,
  Link,
} from "@react-email/components";

interface ResetPasswordTemplateProps {
  name: string;
  verificationLink: string;
}

export default function ResetPasswordTemplate({
  name,
  verificationLink,
}: ResetPasswordTemplateProps) {
  return (
    <Html>
      <Head></Head>
      <Preview>Reset Your Password</Preview>
      <Tailwind>
        <Body className="m-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[480px] rounded border border-solid border-gray-200 px-10 py-5">
            <Heading className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
              Reset Your Password
            </Heading>
            <Text className="ml-1 text-sm leading-4 text-black">
              Hi, {name}
            </Text>
            <Text className="ml-1 mt-4 text-sm leading-4 text-black">
              We received a request to reset your password. Click the button
              below to reset it:
            </Text>
            <Link
              href={verificationLink}
              className="inline-block rounded bg-blue-500 px-5 py-2 text-white no-underline hover:bg-blue-600"
            >
              Reset Password
            </Link>
            <Text className="ml-1 mt-6 text-sm leading-4 text-black">
              If you did not request a password reset, please ignore this email
              or contact support if you have any questions.
            </Text>
            <Text className="ml-1 mt-6 text-sm leading-4 text-black">
              Best regards,
              <br />
              Hack Game, LLC
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
