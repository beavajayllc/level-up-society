import { mindsetResources, type MindsetFormat, type Resource } from "@/lib/resource-library";

type Topic = "credit" | "trading" | "sales" | "digital-marketing" | "mindset";
type Collection = Record<MindsetFormat, Resource[]>;

export const resourceCatalog: Record<Topic, Collection> = {
  credit: {
    books: [
      { title: "Want Credit to Work for You?", creator: "Consumer Financial Protection Bureau", source: "CFPB · Free guide", description: "A practical workbook for understanding credit reports, scores and steps to build a positive credit history.", href: "https://www.consumerfinance.gov/documents/8255/cfpb_your-money-your-goals_credit_booklet_cobrand.pdf", action: "Read the guide", cover: "/resources/book-covers/credit-work.svg", coverCredit: "Illustrated resource cover" },
      { title: "Your Money, Your Goals", creator: "Consumer Financial Protection Bureau", source: "CFPB · Free toolkit", description: "Tools for reviewing credit reports, disputing errors, managing debt and planning your finances.", href: "https://www.consumerfinance.gov/consumer-tools/educator-tool/your-money-your-goals/toolkit/", action: "Explore the toolkit", cover: "/resources/book-covers/money-goals.svg", coverCredit: "Illustrated resource cover" },
    ],
    audiobooks: [
      { title: "The Principles of Economics: Banking and Credit", creator: "Frank A. Fetter · LibriVox volunteers", source: "LibriVox · Audiobook chapter", description: "Listen to chapter 48 for a historical introduction to banking and credit. This early 20th-century text does not cover modern credit scores or laws.", href: "https://librivox.org/the-principles-of-economics-by-frank-albert-fetter/", action: "Find chapter 48" },
      { title: "Top Credit Myths Debunked", creator: "Christina Roman and Rod Griffin", source: "Experian · Podcast", description: "An audio conversation that clears up common myths about credit scores and reports.", href: "https://www.experian.com/blogs/news/creditchatlive-podcast/credit-myths/", action: "Listen to the podcast" },
    ],
    videos: [
      { title: "What Affects Your Credit Score", creator: "Experian", source: "Experian · YouTube", description: "A look at the factors that can affect a credit score.", href: "https://www.youtube.com/watch?v=8QA11Ebchbc" },
      { title: "Your Source for a Truly Free Credit Report", creator: "Federal Trade Commission", source: "FTCVideos · YouTube", description: "Learn about the official source for free credit reports.", href: "https://www.youtube.com/watch?v=HXgMLpc7ivE" },
      { title: "Credit Scores: Personal Finance Tips", creator: "Federal Trade Commission", source: "FTCVideos · YouTube", description: "An introduction to credit reports and credit scores.", href: "https://www.youtube.com/watch?v=iliZgmqgRRE" },
    ],
  },
  trading: {
    books: [
      { title: "Psychology of the Stock Market", creator: "G. C. Selden", source: "Project Gutenberg · 1912", description: "A historical look at emotions, speculation and decision-making in markets.", href: "https://www.gutenberg.org/ebooks/75570", action: "Read on Project Gutenberg", cover: "/resources/book-covers/market-psychology.svg", coverCredit: "Illustrated resource cover" },
      { title: "Saving and Investing", creator: "U.S. Securities and Exchange Commission", source: "Investor.gov · Free guide", description: "An introduction to investing, risk, diversification and financial goals.", href: "https://www.investor.gov/additional-resources/general-resources/publications-research/publications/saving-investing-roadmap", action: "Read the guide", cover: "/resources/book-covers/saving-investing.svg", coverCredit: "Illustrated resource cover" },
    ],
    audiobooks: [
      { title: "Psychology of the Stock Market", creator: "G. C. Selden · LibriVox volunteers", source: "LibriVox · Audiobook", description: "A 1912 classic exploring fear, confidence and crowd behavior in markets. Treat it as historical perspective.", href: "https://librivox.org/psychology-of-the-stock-market-by-g-c-selden/" },
    ],
    videos: [
      { title: "What is Day Trading?", creator: "U.S. Securities and Exchange Commission", source: "SEC · YouTube", description: "A short introduction to day trading and its risks.", href: "https://www.youtube.com/watch?v=Lq9D2VBALKM" },
      { title: "The Basics of Investing", creator: "U.S. Securities and Exchange Commission", source: "SEC · YouTube", description: "Core investing concepts to consider before putting money to work.", href: "https://www.youtube.com/watch?v=XV13bSbjAYo" },
      { title: "What is Currency Trading?", creator: "FXMAG", source: "FXMAG · YouTube", description: "An introductory look at currency trading and forex pairs.", href: "https://www.youtube.com/watch?v=1vndYY8_htc" },
    ],
  },
  sales: {
    books: [
      { title: "Selling Things", creator: "Orison Swett Marden and Joseph Francis MacGrail", source: "Project Gutenberg · Classic", description: "A historical guide to salesmanship, preparation and connecting with customers.", href: "https://www.gutenberg.org/ebooks/59176", action: "Read on Project Gutenberg", cover: "/resources/book-covers/selling-things.svg", coverCredit: "Illustrated resource cover" },
      { title: "The Art of Public Speaking", creator: "Dale Carnegie and J. Berg Esenwein", source: "Project Gutenberg · Classic", description: "A classic guide to communication and speaking with confidence.", href: "https://www.gutenberg.org/ebooks/16317", action: "Read on Project Gutenberg", cover: "/resources/book-covers/public-speaking.svg", coverCredit: "Illustrated resource cover" },
    ],
    audiobooks: [
      { title: "Ads and Sales", creator: "Herbert Newton Casson · LibriVox volunteers", source: "LibriVox · Audiobook", description: "A historical look at salesmanship and advertising fundamentals.", href: "https://librivox.org/ads-and-sales-by-herbert-newton-casson/" },
      { title: "The Art of Public Speaking", creator: "Dale Carnegie and J. Berg Esenwein · LibriVox volunteers", source: "LibriVox · Audiobook", description: "A classic on speaking clearly and engaging an audience.", href: "https://librivox.org/the-art-of-public-speaking-by-dale-carnegie-and-joseph-b-esenwein/" },
    ],
    videos: [
      { title: "3 ways to instantly build rapport with prospects", creator: "Daniel G", source: "Daniel G · YouTube", description: "Daniel shares ways to connect with prospects at the start of a conversation.", href: "https://www.youtube.com/watch?v=92LzIVdyR54" },
      { title: "How to close using the triple M sales method", creator: "Daniel G", source: "Daniel G · YouTube", description: "A sales closing lesson from Daniel G's official channel.", href: "https://www.youtube.com/watch?v=1GCNyUxuTWI" },
      { title: "Closing Customers Faster by Slowing Down", creator: "Andy Elliott", source: "Andy Elliott · YouTube", description: "Andy discusses pacing and communication in sales conversations.", href: "https://www.youtube.com/watch?v=BQ94hQ2ZtLo" },
      { title: "Sales Training: Close Every Deal", creator: "Andy Elliott", source: "Andy Elliott · YouTube", description: "A sales training session with examples from automotive sales.", href: "https://www.youtube.com/watch?v=G6M3PZOkwRM" },
      { title: "What Questions to Ask Prospects During Discovery", creator: "Jeremy Miner", source: "Jeremy Miner · YouTube", description: "Ways to ask questions and listen during a discovery conversation.", href: "https://www.youtube.com/watch?v=dDGX95UkV10" },
      { title: "Sales Close for Hesitant Buyers", creator: "Alex Hormozi", source: "Alex Hormozi · YouTube", description: "A short lesson on speaking with hesitant buyers.", href: "https://www.youtube.com/watch?v=f0mnkPDtiWg" },
    ],
  },
  "digital-marketing": {
    books: [
      { title: "Foundations in Digital Marketing", creator: "Rochelle Grayson", source: "BCcampus · Free textbook", description: "A modern guide to digital strategy, content, SEO, social media, email and analytics.", href: "https://opentextbc.ca/foundationsdigitalmarketing/", action: "Read the textbook", cover: "/resources/book-covers/digital-foundations.svg", coverCredit: "Illustrated resource cover" },
      { title: "Principles of Marketing", creator: "OpenStax · Rice University", source: "OpenStax · Free textbook", description: "A broad introduction to customers, marketing strategy and digital channels.", href: "https://openstax.org/books/principles-marketing/pages/1-unit-introduction", action: "Read the textbook", cover: "/resources/book-covers/marketing-principles.svg", coverCredit: "Illustrated resource cover" },
    ],
    audiobooks: [
      { title: "Ads and Sales", creator: "Herbert Newton Casson · LibriVox volunteers", source: "LibriVox · Audiobook", description: "A historical look at advertising and sales fundamentals. For modern digital tactics, explore the books and videos.", href: "https://librivox.org/ads-and-sales-by-herbert-newton-casson/" },
    ],
    videos: [
      { title: "What is Digital Marketing: Tutorial for Beginners", creator: "HubSpot Marketing", source: "HubSpot Marketing · YouTube", description: "A beginner-friendly introduction to digital marketing channels.", href: "https://www.youtube.com/watch?v=XDpwDwcXGoU" },
      { title: "How to Create a Content Marketing Strategy", creator: "HubSpot Marketing", source: "HubSpot Marketing · YouTube", description: "Learn the building blocks of planning content for an audience.", href: "https://www.youtube.com/watch?v=DSOfPEyeMNg" },
      { title: "SEO Explained", creator: "Google Search Central", source: "Google Search Central · YouTube", description: "Google's introduction to search engine optimization.", href: "https://www.youtube.com/watch?v=xnyJQb37RRw" },
    ],
  },
  mindset: mindsetResources,
};
