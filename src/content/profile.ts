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
  title: 'Sachin Kalaiselvan · Founder, The Ingredient List',
  description:
    'Sachin Kalaiselvan runs The Ingredient List in Bengaluru. He builds THREXA, an ERP for manufacturers, along with backend automation, mobile games and apps, client websites and an open-world game set in Bengaluru.',
  locale: 'en_IN',
  ogImage: '/og/og-default.png',
};

export const profile = {
  /** Name as it should appear on the site. */
  name: 'Sachin Kalaiselvan',
  givenName: 'Sachin',
  familyName: 'Kalaiselvan',
  roleLine: 'Founder, The Ingredient List',
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

/** About section copy, in Sachin's own voice. Edit freely. */
export const about = {
  paragraphs: [
    'I run The Ingredient List, a small studio in Bengaluru. THREXA is its product arm, where I build ERP software for manufacturers. I also make mobile games and apps, build backend automation, design websites for clients, and work on an open-world game set in Bengaluru.',
    'Most of what I build starts with a problem I have seen up close: an owner phoning the floor at night to find out what happened that day, a spreadsheet the whole company depends on, invoices nobody chased. I look at how the work is actually done before deciding what to build.',
    'I do the design, the code and the selling myself.',
  ],
  approach: [
    {
      title: 'Look at the real workflow',
      body: 'I visit the factory or the shop, or read the WhatsApp group where the orders come in. What people do is usually different from what they describe in a meeting.',
    },
    {
      title: 'Start small',
      body: 'One workflow that saves an hour a day is worth more than a dozen modules that look good in a demo.',
    },
    {
      title: 'Design and code together',
      body: 'Wording, layout and speed decide whether people use software, so I treat them as part of the build, not decoration at the end.',
    },
    {
      title: 'Say what’s finished',
      body: 'Every project here shows its real status. If something is a prototype, it says so.',
    },
  ],
  exploring: [
    'Finishing THREXA so it can run in a real plant',
    'Getting a dense 3D city to run on mid-range Android phones',
    'Small mobile games and utilities published under The Ingredient List',
    'Lead pipelines that run on my own server instead of paying per lead',
  ],
  /**
   * Background as stated by Sachin. Dates are left out until confirmed.
   * Delete any line you don't want public.
   */
  background: [
    { label: 'Now', text: 'Founder, The Ingredient List, and its product arm THREXA' },
    { label: 'Before', text: 'Managing Director and AI systems lead at Lavenders Finance, a family-owned NBFC (since closed)' },
    { label: 'Before', text: 'Consulting at Kiran IT Solutions' },
    { label: 'Study', text: 'PGP in Data Science, Great Lakes' },
    { label: 'Study', text: 'BBA in Finance, NMIMS Mumbai' },
  ],
};
