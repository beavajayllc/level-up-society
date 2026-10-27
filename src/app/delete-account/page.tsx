import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Request Account Deletion — Level Up Society",
  description: "Request deletion of your Level Up Society account and associated information.",
};

export default function DeleteAccountPage() {
  return (
    <>
      <Nav />
      <main className="container-x flex-1 py-20 sm:py-28">
        <section className="mx-auto max-w-3xl rounded-[2rem] border border-silver/10 bg-ink-2 p-7 sm:p-12">
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-silver/45">
            Beava Jay LLC · Level Up Society
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.045em] text-silver sm:text-6xl">
            Request account deletion
          </h1>
          <p className="mt-6 text-base leading-8 text-silver/60 sm:text-lg">
            You can request deletion of your Level Up Society account and the
            personal information associated with it by emailing our support team.
          </p>
          <a
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-silver px-6 text-sm font-semibold text-ink transition hover:brightness-110"
            href="mailto:support@level-up-society.com?subject=Level%20Up%20Society%20account%20deletion&body=Please%20delete%20my%20Level%20Up%20Society%20account%20and%20associated%20personal%20information.%0A%0AAccount%20email%20or%20username%3A%20"
          >
            Email a deletion request
          </a>
          <div className="mt-10 space-y-5 border-t border-silver/10 pt-8 text-sm leading-7 text-silver/60">
            <p>
              Include the email address or username connected to your Level Up
              Society account so we can verify and find the right records. Do not
              send your password, a sign-in code, or payment card details.
            </p>
            <p>
              We will review your request and remove or de-identify information
              from systems we control as applicable. Some records may need to be
              retained where required by law or to resolve an active dispute.
              WHOP, Apple, Google, RevenueCat, Telegram, and Calendly manage their
              own accounts and records; contact them separately for deletion of
              information they hold.
            </p>
            <p>
              Requesting account deletion does not cancel a paid subscription.
              Cancel through the service where you subscribed: WHOP, Apple, or
              Google Play. Removing the app from your device also does not cancel
              a subscription.
            </p>
            <p>
              Questions? Email{" "}
              <a className="text-silver underline underline-offset-4" href="mailto:support@level-up-society.com">support@level-up-society.com</a>
              {" "}or read our <Link className="text-silver underline underline-offset-4" href="/privacy-policy">Privacy Policy</Link>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
