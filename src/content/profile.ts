/**
 * Personal profile and site-wide settings.
 * Everything a visitor reads about Sachin as a person lives here.
 * Fields set to null are hidden on the site until you fill them in.
 */

export const site = {
  /**
   * Absolute production URL, no trailing slash. Used for canonical URLs, Open Graph
   * and the sitemap. Set VITE_SITE_URL in Vercel (e.g. https://sachin.example.com).
   * Leave unset until the domain is decided: canonical tags and sitemap are skipped.
   */
  url: (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ?? '',
  title: 'Sachin Kalaiselvan — Founder & independent product builder',
  description:
    'Sachin Kalaiselvan is a Bengaluru founder who builds businesses and the software they run on: a manufacturing ERP, backend automation, mobile apps and an open-world game set in Bengaluru.',
  locale: 'en_IN',
  ogImage: '/og/og-default.png',
};

export const profile = {
  /** Name as it should appear on the site. */
  name: 'Sachin Kalaiselvan',
  givenName: 'Sachin',
  familyName: 'Kalaiselvan',
  roleLine: 'Founder · Independent product builder · Entrepreneur',
  location: 'Bengaluru, India',
  business: {
    name: 'The Ingredient List',
    url: 'https://theingredientlist.co',
  },
  /**
   * Availability indicator in the hero. Keep null unless it is true right now,
   * e.g. 'Taking on two builds for Q1 2027'.
   */
  availability: null as string | null,
  /** Path to a real portrait under /public, e.g. '/media/portrait-1200.webp'. Hidden while null. */
  portrait: null as { src: string; alt: string } | null,
  /** Link to a verified résumé PDF under /public. Hidden while null. */
  resumeUrl: null as string | null,
};

/** Verified contact routes. A null value hides that link everywhere. */
export const contact = {
  email: 'sachin@theingredientlist.co',
  github: 'https://github.com/Sachin-kalaiselvan',
  /** Add your LinkedIn profile URL to show it. */
  linkedin: null as string | null,
  /** Any further professional links: { label, href }. */
  other: [
    { label: 'The Ingredient List', href: 'https://theingredientlist.co' },
  ] as { label: string; href: string }[],
};

/** About section copy. Written from what Sachin has stated; edit freely. */
export const about = {
  lede: 'I start with the business, not the stack.',
  paragraphs: [
    'Most of what I build begins somewhere unglamorous: a production manager answering the same question on the phone every evening, a spreadsheet that has quietly become the company’s memory, an invoice nobody noticed was overdue. I go and look at how the work is actually done, then decide what software should exist.',
    'I run The Ingredient List, a small studio in Bengaluru. THREXA is its product arm, where I build operations software for manufacturers. Alongside it I ship mobile games and apps, build backend automation, design websites for clients, and spend the remaining hours on an open-world game set in the city I live in.',
    'I design, write the code and sell it myself. That keeps me honest about the parts that matter: whether a factory owner will actually open the app at 7 PM, and whether the thing still works on a cheap Android phone.',
  ],
  approach: [
    {
      title: 'Go to where the work happens',
      body: 'Factory floors, shop counters, a WhatsApp group full of order photos. The real workflow is rarely the one people describe in a meeting.',
    },
    {
      title: 'Build the smallest true thing',
      body: 'One workflow that saves an hour every day beats twelve modules that demo well. Scope comes from the problem, not from a feature list.',
    },
    {
      title: 'Design is part of the engineering',
      body: 'Language, layout, motion and speed decide whether software gets used. I treat them with the same care as the schema.',
    },
    {
      title: 'Say what is finished',
      body: 'Every project here is labelled with its real status. Prototypes are called prototypes.',
    },
  ],
  exploring: [
    'Turning the THREXA prototype into a complete, production-ready manufacturing ERP',
    'Real-time 3D for phones: a believable Bengaluru on mid-range Android hardware',
    'Small, sharply designed mobile games and utilities published under The Ingredient List',
    'Lead-generation and qualification pipelines that run on my own servers',
  ],
  /**
   * Background as stated by Sachin. Dates are intentionally omitted until confirmed.
   * Remove any line you would rather not publish.
   */
  background: [
    { label: 'Now', text: 'Founder, The Ingredient List — and its product arm, THREXA' },
    { label: 'Before', text: 'Managing Director and AI systems lead at Lavenders Finance, a family-owned NBFC (since closed)' },
    { label: 'Before', text: 'Consulting stint at Kiran IT Solutions' },
    { label: 'Study', text: 'PGP in Data Science, Great Lakes' },
    { label: 'Study', text: 'BBA in Finance, NMIMS Mumbai' },
  ],
};
