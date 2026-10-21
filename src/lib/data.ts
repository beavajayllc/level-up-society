import {
  BookOpen,
  Compass,
  Dumbbell,
  Landmark,
  Users,
  type LucideIcon,
} from "lucide-react";

export const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Education", href: "#education" },
  { label: "Memberships", href: "#memberships" },
  { label: "FAQ", href: "#faq" },
];

export const heroChips = [
  "Business education",
  "Skills training",
  "Funding & credit",
  "Personal growth",
  "Community",
];

export type Pillar = {
  id: string;
  index: string;
  title: string;
  body: string;
  icon: LucideIcon;
  accent: string;
  image: string;
};

export const pillars: Pillar[] = [
  {
    id: "education",
    index: "01",
    title: "Business Education",
    body: "The essentials of starting and running a business — from shaping an idea worth building to finding real customers and growing something that lasts.",
    icon: BookOpen,
    accent: "from-chrome/25",
    image: "/pillars/business-education.webp",
  },
  {
    id: "training",
    index: "02",
    title: "Skills & Training",
    body: "Practical sessions on the skills you actually use every day — marketing, sales, communication, and the craft of running a business.",
    icon: Dumbbell,
    accent: "from-chrome/20",
    image: "/pillars/skills-training.webp",
  },
  {
    id: "funding",
    index: "03",
    title: "Funding & Credit",
    body: "Put the money side in order. Repair your credit, learn how business funding really works, and line up the capital your next chapter requires.",
    icon: Landmark,
    accent: "from-chrome/30",
    image: "/pillars/funding-credit.webp",
  },
  {
    id: "growth",
    index: "04",
    title: "Personal Growth",
    body: "Build the mindset, habits and confidence that carry you forward — so you keep growing as a person, not just as a business owner.",
    icon: Compass,
    accent: "from-chrome/20",
    image: "/pillars/personal-growth.webp",
  },
  {
    id: "community",
    index: "05",
    title: "The Community",
    body: "Meet entrepreneurs who understand the journey. Share ideas, get honest feedback, celebrate the wins and keep each other moving.",
    icon: Users,
    accent: "from-chrome/25",
    image: "/pillars/community.webp",
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
  "You want real support, not just motivation.",
  "You value connection over competition.",
  "You want a fulfilling life, not just a successful business.",
];

export const notForYou = [
  "You're looking for a get-rich-quick shortcut.",
  "You expect guaranteed results without putting in the work.",
  "You're looking for someone to do the work for you.",
  "You're not open to learning, or to supporting others.",
];

export const membershipFeatures = [
  "Business education & personal growth curriculum",
  "Community chat with active entrepreneurs",
  "Credit repair & business funding support",
  "Skills training: marketing, sales & digital",
  "Forex trade ideas chat",
  "Live streams: Forex, Credit Mastery, Digital Marketing",
  "Entrepreneur calls with special guests",
];

export const faqs = [
  {
    q: "What is Level Up Society?",
    a: "Level Up Society is a paid membership community for entrepreneurs who want to grow a business and a life at the same time. You get structured education, hands-on skills training, funding and credit support, live sessions, and a community of people who are actually building.",
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
    q: "Do I have to be into credit repair?",
    a: "Not at all. Credit repair and business funding are two tools we help you use — not the whole point. Business education, skills training, personal growth and the network are just as much a part of it.",
  },
  {
    q: "What does the membership include?",
    a: "Everything in one place: business education and curriculum, marketing and sales training, credit repair and business funding support, the Forex trade ideas chat, live streams on Forex, credit and digital marketing, entrepreneur calls with special guests, and a community chat that's active every day.",
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

export const testimonies = [
  {
    name: "Marcus A.",
    initials: "MA",
    meta: "2 min ago · Business",
    quote:
      "Credit score went from 512 → 704 in four months. The team took care of everything and now I am getting ready for funding! Can’t wait.",
    tags: ["Credit Repair", "Funding"],
  },
  {
    name: "Darnell R.",
    initials: "DR",
    meta: "18 min ago · Forex",
    quote:
      "The trade ideas chat pays for itself. Easy copy and paste system, they show exactly how to do it, and make sure you are set up for success.",
    tags: ["Forex", "Trade Ideas"],
  },
  {
    name: "Alicia W.",
    initials: "AW",
    meta: "1 hr ago · Mindset",
    quote:
      "I joined not knowing exactly what to expect but the community has definitely kept me here. The events, the calls, the growth in my network, it's all amazing and has boosted my confidence!",
    tags: ["Community", "Growth"],
  },
  {
    name: "Priya S.",
    initials: "PS",
    meta: "3 hrs ago · Funding",
    quote:
      "Needed to get access to some capital to take my business to the next level and they did just that! Pointed me in the right direction and showed me the options available that made the most sense for me!",
    tags: ["Funding", "Capital"],
  },
];
