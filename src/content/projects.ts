import type { ImageMedia, Project } from './types';

/*
 * Selected work. Every claim here is drawn from the project's repository, its
 * published product material, or Sachin's own account of it. To add a project,
 * append an object to `projects` — routes, index, sitemap and OG tags follow.
 */

const img = (
  base: string,
  widths: number[],
  width: number,
  height: number,
  alt: string,
  caption?: string,
): ImageMedia => ({ kind: 'image', base, widths, width, height, alt, caption });

const threxaProduction = img(
  'threxa-production', [640, 960], 964, 544,
  'THREXA production screen: work order WO-1258 traced through corrugation, printing, punching and pasting, with machine, operator and square-foot output for each stage.',
  'Production — a single work order traced stage by stage across the shop floor. Frame from the product demo; sample data.',
);
const threxaMachines = img(
  'threxa-machines', [540, 1080], 1080, 1350,
  'THREXA machine status table listing six machines with status, operator and efficiency; the pasting machine is flagged idle.',
  'Machine status, with the idle pasting machine surfaced. Sample data.',
);
const threxaOverview = img(
  'threxa-overview', [540, 1080], 1080, 1350,
  'THREXA owner view: machine status, dispatch schedule, low-stock materials, revenue, receivables and cash position on one screen.',
  'Every answer on one screen: machines, dispatch, stock and cash. Sample data.',
);
const threxaDispatch = img(
  'threxa-dispatch', [540, 1080], 1080, 1350,
  'THREXA dispatch schedule with challan numbers, customers, vehicle numbers and dispatch status.',
  'Dispatch schedule with challans and vehicles. Sample data.',
);

const guildWelcome = img('guild-welcome', [390, 780], 780, 1688, 'GymGuild welcome screen: “Train together. Progress together. Compete fairly.”', 'Onboarding');
const guildTrain = img('guild-train', [390, 780], 780, 1688, 'GymGuild onboarding step asking which sports you train, from running to hiking.', 'Pick what you train');
const guildJoin = img('guild-join', [390, 780], 780, 1688, 'GymGuild “Join a guild” step explaining that guilds compete per active member.', 'Join or start in a guild');

export const projects: Project[] = [
  {
    slug: 'threxa',
    index: '01',
    name: 'THREXA',
    parent: 'The Ingredient List',
    category: 'Manufacturing ERP',
    role: 'Founder — product, design, engineering, sales',
    status: 'In development',
    statusNote: 'Working prototype across all modules; being completed for production use.',
    period: '2026 —',
    theme: 'product',
    summary: 'Operations software for factories that run on job cards, reels of kraft paper and a phone that never stops ringing.',
    intro: 'It is 7 PM. The last shift has clocked out. The owner of a box plant has four questions and no way to answer them until tomorrow.',
    links: [{ label: 'Product site', href: 'https://threxa.theingredientlist.co/' }],
    stack: ['React', 'TypeScript', 'Vite', 'Supabase', 'PWA', 'Vercel'],
    cover: {
      kind: 'video',
      sources: [
        { src: '/media/threxa-demo.mp4', type: 'video/mp4' },
        { src: '/media/threxa-demo.webm', type: 'video/webm' },
      ],
      poster: '/media/threxa-demo-poster.webp',
      width: 1280,
      height: 720,
      alt: 'THREXA product demo: a customer calls about an order and the production screen traces it across the shop floor in four seconds.',
      caption: 'Order lookup to shop-floor trace. Product demo, sample data.',
    },
    thumb: threxaProduction,
    blocks: [
      {
        type: 'text',
        kicker: 'The problem',
        title: 'The plant runs. Nobody can see it.',
        body: [
          'A corrugated box plant is a chain of machines — corrugation, printing, punching, pasting, dispatch — fed by reels of paper bought by GSM and bursting factor. Orders arrive on WhatsApp. Job cards are paper. Stock lives in someone’s head, and the ledger lives in accounting software that knows nothing about the shop floor.',
          'So the simplest questions are expensive. Which machine sat idle through the whole shift? Which reel is below its reorder level? Where has a customer’s order reached? Of today’s revenue, how much actually reached the bank?',
        ],
      },
      { type: 'media', media: threxaProduction, layout: 'full' },
      {
        type: 'text',
        kicker: 'Why generic software falls short',
        title: 'A box is not a SKU.',
        body: [
          'General-purpose ERPs think in units and item codes. A box plant thinks in ply, flute, board area in square feet, paper grade, and the wastage that accumulates between stages. Forcing that into a generic inventory model is how factories end up running the real system in a notebook beside the software they paid for.',
          'THREXA is built around the plant’s own vocabulary: reels and board instead of “items”, job cards and stages instead of “tasks”, challans and e-way bills on every dispatch.',
        ],
      },
      {
        type: 'list',
        kicker: 'The product',
        title: 'Thirteen modules, one record of the work.',
        columns: 3,
        items: [
          { name: 'Dashboard', body: 'The owner’s view of machines, stock, dispatch and cash on one screen.' },
          { name: 'Customers', body: 'Customer records the rest of the system builds on.' },
          { name: 'Quotations', body: 'Quotes prepared and tracked before they become orders.' },
          { name: 'Orders', body: 'Order-to-dispatch tracking with status a salesperson can read out on a call.' },
          { name: 'Production', body: 'Work orders and job cards traced stage by stage, with machine, operator and output.' },
          { name: 'Products', body: 'Box specifications, with a built-in FEFCO style reference, flute profiles and ECT grades.' },
          { name: 'Inventory', body: 'Reel and board stock against reorder levels.' },
          { name: 'Dispatch', body: 'Schedules, challans, vehicles and e-way bills.' },
          { name: 'Invoices', body: 'GST invoicing tied to what was actually dispatched.' },
          { name: 'Employees', body: 'Records for shop-floor and office staff.' },
          { name: 'Attendance', body: 'Who was on which shift.' },
          { name: 'Payroll', body: 'Wages for the people on those shifts.' },
          { name: 'Cash Book', body: 'Money in and out, against receivables.' },
        ],
      },
      {
        type: 'pair',
        items: [threxaMachines, threxaOverview],
        note: 'Every screen answers one question an owner actually asks. Frames from the product demo, sample data.',
      },
      {
        type: 'text',
        kicker: 'Design decisions',
        title: 'Built for the person who is not at a desk.',
        body: [
          'Owners check the factory from their phone, so THREXA has a mobile layer — an installable web app with separate views for the owner, the supervisor and the driver, each showing only what that person acts on.',
          'The shop floor in Bengaluru does not all read English. The interface runs in English, Kannada, Hindi and Tamil. All thirteen module screens share one design system, so a supervisor who learns one screen has learned them all.',
        ],
      },
      { type: 'media', media: { kind: 'diagram', id: 'threxa-flow', alt: 'Diagram of the THREXA order flow: quotation, order, job card, corrugation, printing, punching, pasting, dispatch, invoice, cash.', caption: 'The order path THREXA models, from quotation to cash.' }, layout: 'inset' },
      {
        type: 'facts',
        kicker: 'Architecture',
        title: 'Deliberately ordinary technology.',
        rows: [
          { label: 'Front end', value: 'React and TypeScript on Vite, with a shared component system across all modules' },
          { label: 'Data', value: 'Supabase (Postgres) — the prototype began on local seed data and is being moved onto it module by module' },
          { label: 'Mobile', value: 'Installable PWA with owner, supervisor and driver views' },
          { label: 'Languages', value: 'English, Kannada, Hindi, Tamil' },
          { label: 'Delivery', value: 'Vercel, deployed from GitHub on every push to main' },
        ],
      },
      { type: 'media', media: threxaDispatch, layout: 'tall' },
      {
        type: 'media',
        layout: 'tall',
        media: {
          kind: 'video',
          sources: [
            { src: '/media/threxa-erp-demo.mp4', type: 'video/mp4' },
            { src: '/media/threxa-erp-demo.webm', type: 'video/webm' },
          ],
          poster: '/media/threxa-erp-demo-poster.webp',
          width: 1080,
          height: 1350,
          alt: 'THREXA product film: four questions an owner cannot answer at 7 PM — an idle machine, low paper stock, a delayed dispatch and overdue receivables — each answered on one screen, then every module on the phone.',
          caption: 'The four-questions film made to send to factory owners. 43 seconds, sample data.',
        },
      },
      {
        type: 'text',
        kicker: 'Challenges',
        title: 'The hardest part is not the code.',
        body: [
          'Factory owners are rightly suspicious of software that arrives as a link. I learned to send a self-contained demo video instead, walk into industrial estates in person, and lead with one painful question rather than a module list.',
          'Positioning only for corrugated plants met too many polite refusals. THREXA is now offered as a custom-built ERP for manufacturers in general, with packaging as the reference implementation it was designed around.',
        ],
      },
      {
        type: 'status',
        kicker: 'Current status',
        title: 'Honest state of the build.',
        done: [
          'All thirteen module screens on a shared design system',
          'Mobile web app with owner, supervisor and driver views',
          'Four-language interface',
          'FEFCO box-style reference inside Products',
          'Product site and recorded product demos',
        ],
        next: [
          'Moving every module from seed data to live data',
          'Completing end-to-end workflows for production use',
          'First deployment in a working plant',
        ],
        note: 'THREXA is not yet running in a customer’s plant.',
      },
    ],
    related: ['sentra', 'papillon-interiors'],
    seo: {
      title: 'THREXA — manufacturing ERP · Sachin Kalaiselvan',
      description: 'Case study: THREXA, the manufacturing ERP Sachin Kalaiselvan is building at The Ingredient List — production, reel inventory, dispatch, GST invoicing and payroll for box plants.',
    },
  },
  {
    slug: 'what-ra-sudeeep',
    index: '02',
    name: 'WHAT RA SUDEEEP?',
    category: 'Open-world game',
    role: 'Solo developer — direction, design, engineering',
    status: 'In development',
    statusNote: 'Systems in development. No public build yet.',
    period: '2026 —',
    theme: 'game',
    summary: 'A serious open-world driving and action game set in a fictional Bengaluru, with the city’s own humour and Kannada dialogue.',
    intro: 'Not a meme. Not a cartoon. A city you can recognise from the driver’s seat — the traffic, the noise, the arguments — played completely straight.',
    links: [],
    stack: [],
    cover: {
      kind: 'diagram',
      id: 'city-plan',
      alt: 'Abstract plan of a fictional Bengaluru district: arterial roads, a flyover, narrow lanes and a market grid drawn in fine lines.',
      caption: 'Illustration of the district plan, drawn for this page. Gameplay capture will replace it when a build is public.',
    },
    thumb: {
      kind: 'diagram',
      id: 'city-plan',
      alt: 'Abstract plan of a fictional Bengaluru district.',
    },
    blocks: [
      {
        type: 'text',
        kicker: 'The concept',
        title: 'Bengaluru, taken seriously.',
        body: [
          'Open-world games have given us Los Angeles, Miami and London many times over. Nobody has given the player a Bengaluru that feels real: two-wheelers filling every gap, autos negotiating at the kerb, buses that own the left lane, flyovers that end without warning.',
          'WHAT RA SUDEEEP? is a realistic open-world driving and action game in that spirit. The presentation is serious. The humour comes from the place — the dialogue, the traffic, the situations — the way it does in the city itself.',
        ],
      },
      { type: 'pull', text: 'The jokes are in Kannada. The streets are played straight.' },
      {
        type: 'list',
        kicker: 'World and systems',
        title: 'What the game is being built around.',
        columns: 2,
        items: [
          { name: 'World', body: 'A fictional Bengaluru built from recognisable district types — arterial roads, markets, narrow residential lanes, flyovers — using real place names on the map.', state: 'In development' },
          { name: 'Traffic', body: 'Traffic that behaves like the city’s: lane discipline as a suggestion, two-wheelers in every gap, buses and autos with their own logic.', state: 'In development' },
          { name: 'Vehicles', body: 'The vehicles that actually fill the city’s roads, with handling tuned for touchscreen driving.', state: 'In development' },
          { name: 'Characters and dialogue', body: 'Voice lines spoken in Kannada, with local humour carried by the writing rather than the art style.', state: 'In development' },
          { name: 'Police and wanted', body: 'A wanted system that escalates through the city’s own streets rather than open highways.', state: 'Planned' },
          { name: 'Missions', body: 'Missions built from situations a Bengaluru driver would recognise.', state: 'Planned' },
        ],
      },
      { type: 'media', media: { kind: 'diagram', id: 'city-plan', alt: 'District plan illustration showing road hierarchy.', caption: 'Road hierarchy sketch: arterial, flyover, lanes, market. Illustration, not a game capture.' }, layout: 'full' },
      {
        type: 'text',
        kicker: 'Visual development',
        title: 'From code-drawn shapes to real assets.',
        body: [
          'The first prototype ran in the browser with geometry generated in code. It proved the idea and showed its ceiling: a city built from boxes cannot carry this tone. The project has moved to real 3D models and textures, aiming at a level of street detail that makes the city read instantly.',
          'Every shop sign, brand and character is invented. Real place names stay on the map; real companies, logos and likenesses do not.',
        ],
      },
      {
        type: 'facts',
        kicker: 'Technical direction',
        title: 'Built for the phone in your pocket.',
        rows: [
          { label: 'Platform', value: 'Android first, PC second' },
          { label: 'Rendering', value: '3D open world with real models and textures' },
          { label: 'Audio', value: 'Kannada voice lines' },
          { label: 'Constraint', value: 'Every feature must run on mid-range Android phones' },
        ],
      },
      {
        type: 'text',
        kicker: 'Challenges',
        title: 'A dense city on a cheap phone.',
        body: [
          'Bengaluru’s character is density — shopfronts, signage, parked vehicles, people. That is exactly what a mobile GPU struggles with. The work is in streaming, level of detail and deciding which details carry the feeling of the street and which can go.',
          'Tone is the other risk. It would be easy to make this a parody. Keeping it serious while letting the city be funny is a writing problem as much as a design one.',
        ],
      },
      {
        type: 'status',
        kicker: 'Current status',
        title: 'In development.',
        done: ['Concept, tone and world direction set', 'Browser prototype with code-generated geometry', 'Decision to rebuild on real 3D models and textures', 'Invented-brand policy for every sign, logo and character'],
        next: ['Driving and traffic systems on device', 'First playable district', 'Gameplay capture for this page'],
        note: 'No public build exists yet. Systems listed above are being built, not finished.',
      },
    ],
    related: ['fitness-guild'],
    seo: {
      title: 'WHAT RA SUDEEEP? — open-world game in development · Sachin Kalaiselvan',
      description: 'A realistic open-world driving and action game set in a fictional Bengaluru, with Kannada dialogue and local humour. In development by Sachin Kalaiselvan.',
    },
  },
  {
    slug: 'sentra',
    index: '03',
    name: 'Sentra',
    category: 'Backend & workflow engineering',
    role: 'Designed and built',
    status: 'Open source',
    period: '2026',
    theme: 'system',
    summary: 'Drop in an invoice, a spreadsheet or a scanned page. Four agents read it, judge it, act on it and remember it.',
    intro: 'Businesses drown in documents that each need a small decision. Sentra makes the decision, shows its working, and asks before it does anything risky.',
    links: [{ label: 'Source on GitHub', href: 'https://github.com/Sachin-kalaiselvan/sentra' }],
    stack: ['FastAPI', 'LangGraph', 'Celery', 'Redis', 'Qdrant', 'Groq · Llama 3.3 70B', 'Docker Compose', 'Prometheus', 'GitHub Actions'],
    cover: {
      kind: 'diagram',
      id: 'sentra-pipeline',
      alt: 'Sentra pipeline: upload, then Extract, Reason, Act and Memory agents, with a conditional branch that skips Act when no actions are recommended and an approval gate for high-risk actions.',
      caption: 'The agent graph, as implemented in the repository.',
    },
    thumb: {
      kind: 'diagram',
      id: 'sentra-pipeline',
      alt: 'Sentra agent pipeline diagram.',
    },
    blocks: [
      {
        type: 'text',
        kicker: 'Purpose',
        title: 'Paperwork that reads itself.',
        body: [
          'An overdue invoice with a missing PO number and a duplicated line item should not wait for someone to notice. Sentra takes any business document — PDF, CSV, Word, Excel, plain text or an image — and runs it through a pipeline that extracts the content, classifies it, finds anomalies, recommends actions and files the decision so it can be found again.',
        ],
      },
      {
        type: 'list',
        kicker: 'The agents',
        title: 'Four steps, each with one job.',
        columns: 2,
        items: [
          { name: 'Extract', body: 'Parses PDF, CSV, DOCX, XLSX and text, and reads images through OCR.' },
          { name: 'Reason', body: 'Sends the content to Llama 3.3 70B on Groq to classify the document, rate its risk, list anomalies and recommend actions.' },
          { name: 'Act', body: 'Creates Jira tickets, sends email and posts to Slack. High-risk actions wait for human approval.' },
          { name: 'Memory', body: 'Embeds each decision into Qdrant so past documents can be found by meaning.' },
        ],
      },
      {
        type: 'text',
        kicker: 'Engineering decisions',
        title: 'Slow work off the request path. Risky work behind a gate.',
        body: [
          'Uploads return immediately with a task ID; the pipeline runs on Celery workers backed by Redis, and the client polls for status. The agent graph is built in LangGraph with a conditional edge: if the reasoning step recommends no actions — or something has failed — the run skips straight to memory.',
          'Anything rated high risk is parked in Redis for 24 hours and executed only when someone calls the approve endpoint. Integrations are optional: an unconfigured Jira or Slack returns a clear “not configured” result instead of crashing the run.',
        ],
      },
      {
        type: 'code',
        kicker: 'A documented run',
        title: 'What comes out the other end.',
        label: 'POST /upload · test_invoice.txt → GET /status/{task_id}',
        code: `{
  "document_type": "invoice",
  "risk_level": "high",
  "anomalies": [
    "invoice overdue — due 2024-01-01",
    "client PO number missing",
    "duplicate line item: ₹42,000 appears twice"
  ],
  "recommended_actions": [
    { "action_type": "jira_ticket",   "priority": "high" },
    { "action_type": "slack_message", "priority": "high" }
  ]
}`,
        note: 'Output recorded in the project README for the bundled test invoice. High risk, so both actions were queued for approval.',
      },
      {
        type: 'facts',
        kicker: 'Architecture',
        title: 'Six services, one compose file.',
        rows: [
          { label: 'API', value: 'FastAPI on uvicorn — upload, status, approve, audit, memory search, metrics' },
          { label: 'Workers', value: 'Celery with Redis as broker; Flower for monitoring' },
          { label: 'Orchestration', value: 'LangGraph state graph with conditional routing' },
          { label: 'Memory', value: 'Qdrant with all-MiniLM-L6-v2 sentence embeddings' },
          { label: 'Observability', value: 'Prometheus metrics endpoint and structured logs' },
          { label: 'Database', value: 'PostgreSQL is provisioned in the compose stack; the current pipeline keeps state in Redis and Qdrant' },
          { label: 'CI', value: 'GitHub Actions installs dependencies and checks every agent imports cleanly' },
        ],
      },
      {
        type: 'status',
        kicker: 'Current status',
        title: 'Runs locally, end to end.',
        done: ['Four-agent pipeline with conditional routing', 'Approval gate for high-risk actions', 'Semantic search over past decisions', 'Dashboard for upload, history, approvals and memory search'],
        next: ['Persisting run history in Postgres', 'Automated tests beyond import checks'],
        note: 'Open-source project; not deployed as a hosted service.',
      },
    ],
    related: ['threxa'],
    seo: {
      title: 'Sentra — multi-agent document automation · Sachin Kalaiselvan',
      description: 'Sentra: FastAPI, Celery, Redis, LangGraph and Qdrant pipeline where four agents extract, reason, act and remember across business documents. Built by Sachin Kalaiselvan.',
    },
  },
  {
    slug: 'fitness-guild',
    index: '04',
    name: 'Fitness Guild',
    category: 'Consumer mobile app',
    role: 'Product, design, engineering',
    status: 'Released experiment',
    statusNote: 'Shelved in November 2026 after competitor research.',
    period: '2026',
    theme: 'app',
    summary: 'A fitness app where your gym is your guild, every kind of training counts, and a small guild that shows up beats a big one that doesn’t.',
    intro: 'Most fitness apps reward whoever already trains the most. Fitness Guild — built as GymGuild — tried to reward showing up together.',
    links: [],
    stack: ['JavaScript', 'Vite', 'Capacitor', 'Android', 'Supabase', 'Postgres row-level security', 'Edge Functions'],
    cover: { ...guildWelcome, caption: 'GymGuild on Android — onboarding.' },
    thumb: guildWelcome,
    blocks: [
      {
        type: 'text',
        kicker: 'The idea',
        title: 'Your gym is a team. Treat it like one.',
        body: [
          'People train harder for a group than for a streak counter. Fitness Guild made the gym — or any group of friends — a guild that competes across a season.',
          'Three rules shaped everything. Any training counts: a swim and a lifting session earn the same credit. Guilds compete per active member, so a small guild that shows up beats a large one that doesn’t. And lifting ranks adjust for bodyweight, from Iron to Champion, so comparisons stay fair.',
        ],
      },
      { type: 'phones', items: [guildWelcome, guildTrain, guildJoin], note: 'Screens captured from the app build.' },
      {
        type: 'list',
        kicker: 'Product experience',
        title: 'Designed so day one is never empty.',
        columns: 3,
        items: [
          { name: 'Starter guilds', body: 'Skip choosing and you join new people in your city, so leaderboards have life from the first session.' },
          { name: 'Season board', body: 'Guilds climb a seasonal board, so every session is a contribution to something bigger than a personal streak.' },
          { name: 'Live sessions', body: 'A native Android plugin shows a running session in the status bar — a timer chip on Android 16, a progress notification on older versions.' },
        ],
      },
      {
        type: 'facts',
        kicker: 'Architecture',
        title: 'Competition only works if scores can be trusted.',
        rows: [
          { label: 'App', value: 'Web app packaged for Android with Capacitor' },
          { label: 'Data', value: 'Supabase Postgres: profiles, guilds, gyms, activities, kudos, challenges, moderation — all behind row-level security' },
          { label: 'Integrity', value: 'Clients never write sessions or points directly. An Edge Function checks the user’s token and the Play Integrity verdict, then logs the activity' },
          { label: 'Points', value: 'An append-only XP ledger: every point has a row, and nothing else can add XP' },
        ],
      },
      {
        type: 'text',
        kicker: 'What I learned',
        title: 'Research early, and believe it.',
        body: [
          'Competitor research after release showed the core loop — gym communities, group challenges, social leaderboards — was already well served by Strava and Cult.fit. A better scoring model was not a strong enough reason for people to move their training history.',
          'So I shelved it rather than spend on acquisition. The integrity model and the per-member scoring are the parts I would carry into the next consumer product.',
        ],
      },
      {
        type: 'status',
        kicker: 'Current status',
        title: 'Released, then shelved.',
        done: ['Android app with onboarding, guilds, competition and profiles', 'Server-checked activity logging', 'Native live-session notification'],
        next: [],
        note: 'Not in active development. No user numbers are claimed.',
      },
    ],
    related: ['what-ra-sudeeep'],
    seo: {
      title: 'Fitness Guild — guild-based fitness app · Sachin Kalaiselvan',
      description: 'Fitness Guild (GymGuild): a released Android experiment where gyms compete as guilds with fair, server-verified scoring. Product, design and engineering by Sachin Kalaiselvan.',
    },
  },
  {
    slug: 'papillon-interiors',
    index: '05',
    name: 'Papillon Interiors',
    category: 'Website · Client work',
    role: 'Design and development',
    status: 'Client project',
    period: '2026',
    theme: 'client',
    summary: 'A quiet, image-led website for an interior design studio — built to feel like walking through a finished room.',
    intro: 'An interior studio sells taste. The website has to show it before a single word is read.',
    links: [{ label: 'Visit the site', href: 'https://papllions.vercel.app/' }],
    stack: ['TanStack Start', 'React 19', 'Tailwind CSS', 'Framer Motion', 'Vercel'],
    cover: img('papillon-hero', [800, 1600], 1920, 1088, 'Warm living room with green velvet sofa, arched windows and travertine table, used as the Papillon Interiors homepage image.', 'Homepage art direction for Papillon Interiors.'),
    thumb: img('papillon-hero', [800, 1600], 1920, 1088, 'Papillon Interiors homepage image.'),
    blocks: [
      {
        type: 'text',
        kicker: 'The brief',
        title: 'The Design You Desire.',
        body: [
          'Papillon Interiors needed a site that carried its tagline: warm, unhurried and confident. The structure is simple — studio, a gallery with a page per project, and a direct route to an enquiry — so the imagery and typography can do the work.',
          'I moved the project off a site builder onto its own codebase, with server rendering for fast first loads and search visibility, and restrained motion that reveals rooms rather than performing.',
        ],
      },
      {
        type: 'facts',
        kicker: 'Build',
        title: 'Fast, crawlable, easy to extend.',
        rows: [
          { label: 'Framework', value: 'TanStack Start with server rendering on React 19' },
          { label: 'Styling', value: 'Tailwind CSS v4' },
          { label: 'Motion', value: 'Framer Motion' },
          { label: 'Hosting', value: 'Vercel' },
        ],
      },
      {
        type: 'status',
        kicker: 'Status',
        title: 'Live.',
        done: ['Marketing site with studio, gallery and contact pages', 'Brand lockups applied across the site'],
        next: ['Lead-generation pipeline for the studio, built as a separate project'],
      },
    ],
    related: ['threxa'],
    seo: {
      title: 'Papillon Interiors website · Sachin Kalaiselvan',
      description: 'Website design and development for Papillon Interiors, an interior design studio. Client work by Sachin Kalaiselvan.',
    },
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
