import { Brain, CandlestickChart, CreditCard, Megaphone, MessagesSquare } from "lucide-react";

export const masteryTopics = [
  { slug: "credit", title: "Credit Mastery", description: "Build a stronger foundation for your credit journey.", icon: CreditCard },
  { slug: "trading", title: "Trading Mastery", description: "Explore the skills and habits behind trading.", icon: CandlestickChart },
  { slug: "sales", title: "Sales Mastery", description: "Grow your confidence in conversations and selling.", icon: MessagesSquare },
  { slug: "digital-marketing", title: "Digital Marketing Mastery", description: "Learn how to reach and connect with your audience.", icon: Megaphone },
  { slug: "mindset", title: "Mindset Mastery", description: "Strengthen your mindset, habits and focus as you build.", icon: Brain },
] as const;

export const mindsetFormats = [
  { slug: "audiobooks", title: "Audiobooks", description: "Listen to ideas that help you grow wherever you are." },
  { slug: "books", title: "Books", description: "Make space for a fresh perspective and deeper learning." },
  { slug: "videos", title: "Videos", description: "Watch practical ideas from inspiring speakers and creators." },
] as const;

export type MindsetFormat = (typeof mindsetFormats)[number]["slug"];
type Resource = { title: string; creator: string; source: string; description: string; href: string };

export const mindsetResources: Record<MindsetFormat, Resource[]> = {
  audiobooks: [
    { title: "As a Man Thinketh", creator: "James Allen · Read by Audio Andrea", source: "LibriVox", description: "A classic reflection on thought, character and purpose.", href: "https://librivox.org/as-a-man-thinketh-by-james-allen-2/" },
    { title: "How to Live on Twenty-Four Hours a Day", creator: "Arnold Bennett · Read by Mark F. Smith", source: "LibriVox", description: "A thoughtful guide to making room for growth in your daily life.", href: "https://librivox.org/how-to-live-on-twenty-four-hours-a-day-by-arnold-bennett/" },
    { title: "The Art of Money Getting", creator: "P. T. Barnum · Read by Jill Preston", source: "LibriVox", description: "A historical take on business habits, persistence and money.", href: "https://librivox.org/the-art-of-money-getting-by-p-t-barnum/" },
  ],
  books: [
    { title: "As a Man Thinketh", creator: "James Allen", source: "Project Gutenberg", description: "A short classic about the connection between thought and character.", href: "https://www.gutenberg.org/ebooks/4507" },
    { title: "Meditations", creator: "Marcus Aurelius", source: "Project Gutenberg", description: "Stoic reflections on perspective, discipline and meeting challenges.", href: "https://www.gutenberg.org/ebooks/2680" },
    { title: "How to Live on 24 Hours a Day", creator: "Arnold Bennett", source: "Project Gutenberg", description: "A classic on using your time intentionally and making room to grow.", href: "https://www.gutenberg.org/ebooks/2274" },
  ],
  videos: [
    { title: "The power of believing that you can improve", creator: "Carol Dweck", source: "TED · YouTube", description: "An introduction to the growth mindset and the power of learning through challenges.", href: "https://www.youtube.com/watch?v=_X0mgOOSpLU" },
    { title: "Inside the mind of a master procrastinator", creator: "Tim Urban", source: "TED · YouTube", description: "A memorable look at procrastination and making time for what matters.", href: "https://www.youtube.com/watch?v=arj7oStGLkU" },
    { title: "Grit: The power of passion and perseverance", creator: "Angela Lee Duckworth", source: "TED · YouTube", description: "Explore the role of persistence and long-term commitment in reaching goals.", href: "https://www.youtube.com/watch?v=H14bBuluwB8" },
    { title: "How to get better at the things you care about", creator: "Eduardo Briceño", source: "TED · YouTube", description: "Learn how to balance doing the work with making time to improve.", href: "https://www.youtube.com/watch?v=YKACzIrog24" },
  ],
};
