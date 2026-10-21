import {
  BookOpen,
  Compass,
  CreditCard,
  Dumbbell,
  Users,
  type LucideIcon,
} from "lucide-react";

export const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Education", href: "#education" },
  { label: "Memberships", href: "#memberships" },
  { label: "FAQ", href: "#faq" },
];

export type Pillar = {
  id: string;
  index: string;
  title: string;
  body: string;
  icon: LucideIcon;
  accent: string;
};

export const pillars: Pillar[] = [
  {
    id: "education",
    index: "01",
    title: "Business Education",
    body: "The essentials of starting and running a business — from shaping an idea worth building to finding real customers and growing something that lasts.",
    icon: BookOpen,
    accent: "from-chrome/25",
  },
  {
    id: "training",
    index: "02",
    title: "Skills & Training",
    body: "Practical sessions on the skills you actually use every day — communication, sales, marketing, and the craft of running a business.",
    icon: Dumbbell,
    accent: "from-chrome/20",
  },
  {
    id: "credit",
    index: "03",
    title: "Credit Repair & Funding",
    body: "Put your finances in order. Clean up your credit, understand your reports, and line up the funding your next chapter requires.",
    icon: CreditCard,
    accent: "from-chrome/30",
  },
  {
    id: "growth",
    index: "04",
    title: "Personal Growth",
    body: "Build the mindset, habits and confidence that carry you forward — so you keep growing as a person, not just as a business owner.",
    icon: Compass,
    accent: "from-chrome/20",
  },
  {
    id: "community",
    index: "05",
    title: "The Community",
    body: "Meet entrepreneurs who understand the journey. Share ideas, get honest feedback, celebrate the wins and keep each other moving.",
    icon: Users,
    accent: "from-chrome/25",
  },
];

export const journey = [
  {
    index: "01",
    title: "Start with an idea",
    body: "Find your direction, understand your audience, and shape an idea worth building.",
  },
  {
    index: "02",
    title: "Build your foundation",
    body: "Develop your offer, strengthen your habits, and turn plans into consistent action.",
  },
  {
    index: "03",
    title: "Grow with intention",
    body: "Refine your business, develop as a leader, and make space for the life you actually want.",
  },
];

export const forYou = [
  "You want to turn ideas into meaningful action.",
  "You're ready to invest in your personal growth.",
  "You value connection over competition.",
  "You want a fulfilling life, not just a successful business.",
];

export const notForYou = [
  "You're looking for a get-rich-quick shortcut.",
  "You expect guaranteed results without putting in the work.",
  "You're not open to learning, or to supporting others.",
];

export const membershipFeatures = [
  "Business education & personal growth curriculum",
  "Community chat with active entrepreneurs",
  "Credit Repair & Business Funding support",
  "Forex trade ideas chat",
  "Live streams: Forex, Credit Mastery, Digital Marketing",
  "Entrepreneur calls with special guests",
];

export const faqs = [
  {
    q: "What is Level Up Society?",
    a: "Level Up Society is a paid membership community for entrepreneurs who want to grow a business and a life at the same time. You get structured education, live sessions, credit repair and funding support, and a community of people who are actually building.",
  },
  {
    q: "Do I need to own a business already?",
    a: "No. If you have an idea you want to shape or a business you want to level up, you're in the right place. The journey starts at the beginning and works up from there.",
  },
  {
    q: "Is this only about business?",
    a: "Not at all. Business education is one half. The other half is personal growth — the mindset, habits and confidence that keep you moving when business gets hard.",
  },
  {
    q: "How do I join?",
    a: "Join the waitlist or upgrade to Level Up Pro from the membership section. Membership opens soon and members get first access when it does.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Membership renews monthly and you can cancel any time. There are no long-term commitments and no cancellation fees.",
  },
];

export const marqueeItems = [
  "Business Education",
  "Skills Training",
  "Credit Repair",
  "Business Funding",
  "Personal Growth",
  "Live Masterclasses",
  "Entrepreneur Calls",
  "Community Chat",
];

