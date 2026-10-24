import { SmoothScroll } from "@/components/SmoothScroll";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Pillars } from "@/components/Pillars";
import { Journey } from "@/components/Journey";
import { Philosophy } from "@/components/Philosophy";
import { Pricing } from "@/components/Pricing";
import { Faq } from "@/components/Faq";
import { CallToAction } from "@/components/CallToAction";
import { Footer } from "@/components/Footer";

// The shared navigation reads the signed-in user's WHOP session per request.
export const instant = false;

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Nav />
      <main className="flex-1">
        <Hero />
        <Pillars />
        <Journey />
        <Philosophy />
        <Pricing />
        <Faq />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
