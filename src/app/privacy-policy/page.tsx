import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { PublicPageNav } from "@/components/PublicPageNav";

export const metadata: Metadata = {
  title: "Privacy Policy — Level Up Society",
  description: "How Beava Jay LLC handles information for Level Up Society's website and mobile app.",
};

const sections = [
  {
    title: "Information we handle",
    paragraphs: [
      "When you sign in with WHOP, we may receive your name, username, email address, profile image, and WHOP account identifier. We use these details to sign you in, connect your membership, and provide member features. We store linked WHOP credentials in encrypted form so member features such as chat can work securely.",
      "We receive membership and subscription details needed to check access, such as whether your Level Up Pro membership is active and its relevant status or expiration. WHOP processes web purchases. Apple and Google process purchases made in their stores, and RevenueCat helps us synchronize app subscription entitlements. We do not receive your full payment card number through the app.",
      "If you use member chat or contact support, we handle the messages and details you choose to send. Live chat messages may be visible to other members and the host. If you join the optional Telegram trade ideas group or book through Calendly, those services receive information under their own privacy practices.",
      "Our hosting, authentication, and streaming providers may process technical information needed to operate and secure the service, such as network address, device or browser details, request logs, and session identifiers. The app does not request access to your contacts or precise location.",
    ],
  },
  {
    title: "How we use information",
    paragraphs: [
      "We use information to provide and secure sign-in, confirm Level Up Pro access, process or restore app subscriptions, deliver member resources and livestreams, support member chat, respond to requests, prevent misuse, and meet legal obligations.",
      "Level Up Society does not use advertising in the app and does not sell personal information. We share information with service providers only as needed to run the service, with your direction, or when required to protect rights, safety, or comply with law.",
    ],
  },
  {
    title: "Service providers",
    paragraphs: [
      "Our providers include WHOP for sign-in, web membership, checkout, livestream information, and member chat; Apple and Google for store billing; RevenueCat for subscription entitlement management; Vercel for website hosting; Cloudflare for livestream delivery; Telegram for the optional trade ideas group; and Calendly for appointment booking. Each provider handles information under its own terms and privacy policy.",
    ],
  },
  {
    title: "Retention and security",
    paragraphs: [
      "We keep information for as long as needed to provide the service, maintain account and subscription records, resolve disputes, protect the platform, and meet legal requirements. We use safeguards such as encrypted storage for linked WHOP credentials and secure session storage. No online service can guarantee absolute security.",
    ],
  },
  {
    title: "Your choices and requests",
    paragraphs: [
      "You can ask us to access, correct, or delete personal information we control by using the account-deletion page or contacting support. A subscription must be canceled through the service where you purchased it—WHOP, Apple, or Google. Deleting the app or requesting deletion from Level Up Society does not cancel a subscription or delete accounts held by those independent providers.",
      "The service is not directed to children under 13. We do not knowingly collect personal information from children under 13.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <PublicPageNav />
      <main className="container-x flex-1 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-silver/45">
            Beava Jay LLC · Effective October 26, 2026
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.045em] text-silver sm:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-silver/60 sm:text-lg">
            This policy explains how Level Up Society handles information through
            our website and mobile app.
          </p>

          <div className="mt-12 space-y-10 rounded-[2rem] border border-silver/10 bg-ink-2 p-6 sm:p-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold tracking-tight text-silver sm:text-2xl">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-7 text-silver/60">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <section id="account-deletion" className="scroll-mt-24 border-t border-silver/10 pt-8">
              <h2 className="text-xl font-semibold tracking-tight text-silver sm:text-2xl">
                Account and data deletion
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-silver/60">
                To request deletion of your Level Up Society account and associated
                information, visit our <a className="text-silver underline underline-offset-4" href="/delete-account">account-deletion page</a> or email{" "}
                <a className="text-silver underline underline-offset-4" href="mailto:support@level-up-society.com?subject=Level%20Up%20Society%20account%20deletion">support@level-up-society.com</a>.
                We may retain records when the law requires it or to resolve an
                active dispute. Deletion requests do not remove information held
                by WHOP, Apple, Google, RevenueCat, Telegram, or Calendly; contact
                those providers for their records.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight text-silver sm:text-2xl">
                Changes and contact
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-silver/60">
                We may update this policy as the service changes. For privacy
                questions, contact Beava Jay LLC at{" "}
                <a className="text-silver underline underline-offset-4" href="mailto:support@level-up-society.com">support@level-up-society.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
