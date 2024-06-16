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

interface VerifyEmailTemplateProps {
  name: string;
  verificationLink: string;
}

export default function VerifyEmailTemplate({
  name,
  verificationLink,
}: VerifyEmailTemplateProps) {
  return (
    <Html>
      <Head></Head>
      <Preview>Verify Email</Preview>
      <Tailwind>
        <Body className="m-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[480px] rounded border border-solid border-gray-200 px-10 py-5">
            <Heading className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
              Verify Email
            </Heading>
            <Text className="ml-1 text-sm leading-4 text-black">
              Hi, {name}
            </Text>
            <Text className="ml-1 mt-4 text-sm leading-4 text-black">
              Please click the button below to verify your email address and
              complete your registration:
            </Text>
            <Link
              href={verificationLink}
              className="inline-block rounded bg-blue-500 px-5 py-2 text-white no-underline hover:bg-blue-600"
            >
              Verify Email
            </Link>
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
