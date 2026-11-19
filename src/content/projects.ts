import type { ImageMedia, Project } from './types';

/*
 * Selected work. Every claim here comes from the project's repository, its
 * product material, or Sachin's own account of it. To add a project, append
 * an object to `projects`; routes, index, sitemap and meta tags follow.
 */

const img = (
  base: string,
  widths: number[],
  width: number,
  height: number,
  alt: string,
  caption?: string,
): ImageMedia => ({ kind: 'image', base, widths, width, height, alt, caption });

/* THREXA: panels cropped from the product film at full resolution. Sample data. */
const threxaOverview = img(
  'threxa-overview', [640, 1065], 1065, 650,
  'THREXA owner screen with machine status, dispatch schedule, low-stock paper, revenue, receivables and cash position.',
  'Owner view. Machines, dispatch, paper stock and cash on one screen. Sample data.',
);
const threxaMachines = img(
  'threxa-machines', [600, 1008], 1008, 680,
  'THREXA machine status table. Five machines running or in maintenance, the pasting machine highlighted as idle.',
  'Machine status. The pasting machine has been idle all shift.',
);
const threxaStock = img(
  'threxa-stock', [600, 1008], 1008, 488,
  'THREXA low-stock list of four paper grades below their reorder levels, kraft paper 200 GSM highlighted.',
  'Paper below reorder level, by grade and GSM.',
);
const threxaDispatch = img(
  'threxa-dispatch', [600, 1008], 1008, 588,
  'THREXA dispatch schedule with times, challan numbers, customers, vehicle numbers and status; one load marked delayed.',
  'Dispatch schedule with challans and vehicles. One load is running late.',
);

/* Sentra: the real dashboard (app/static/index.html), showing the run documented in the README. */
const sentraRun = img(
  'sentra-run', [960, 1600, 2880], 2880, 2020,
  'Sentra dashboard after a run on test_invoice.txt: risk high, a summary of the overdue invoice, a four-step agent trace, three anomalies and actions waiting for approval.',
  'Sentra’s dashboard with the test invoice from the repo. The result shown is the output documented in the README.',
);
const sentraMemory = img(
  'sentra-memory', [960, 1600, 2880], 2880, 760,
  'Sentra memory search for “overdue invoice missing PO” returning the earlier invoice at 87.1% similarity.',
  'Searching past decisions by meaning. The earlier invoice comes back at 87% similarity.',
);

const sentraResult = img(
  'sentra-result', [960, 1600, 2370], 2370, 1070,
  'Sentra pipeline result for test_invoice.txt: risk high, a one-line summary of the overdue invoice, a four-step agent trace, three anomalies and actions awaiting approval.',
  'Result for the test invoice in the repo, as documented in the README.',
);

/* Papillon: captured from the site's own codebase at 2x. */
const papHome = img(
  'papillon-home', [960, 1600, 2880], 2880, 1800,
  'Papillon Interiors home page: a warm living room photograph with the headline “Spaces That Feel Like You.” and links to the work and to start a project.',
  'Home page.',
);
const papGallery = img(
  'papillon-gallery', [960, 1600, 2880], 2880, 1800,
  'Papillon Interiors gallery page on a dark green header with filters for living, bedroom, kitchen and dining, bath, furniture and commercial.',
  'Gallery with room filters.',
);
const papProject = img(
  'papillon-project', [960, 1600, 2880], 2880, 1800,
  'Papillon Interiors project page titled “The Green Salon” over a full-width room image.',
  'A project page.',
);
const papMobile = img(
  'papillon-mobile', [390, 780], 1170, 2532,
  'Papillon Interiors home page on a phone.',
  'On a phone.',
);

const guildWelcome = img('guild-welcome', [390, 780], 780, 1688, 'GymGuild welcome screen: “Train together. Progress together. Compete fairly.”', 'Welcome');
const guildTrain = img('guild-train', [390, 780], 780, 1688, 'GymGuild onboarding step asking which kinds of training you do.', 'Pick what you train');
const guildJoin = img('guild-join', [390, 780], 780, 1688, 'GymGuild “Join a guild” step explaining that guilds compete per active member.', 'Join a guild');

export const projects: Project[] = [
  {
    slug: 'threxa',
    index: '01',
    name: 'THREXA',
    parent: 'The Ingredient List',
    category: 'Manufacturing ERP',
    role: 'Everything: product, design, code, sales',
    status: 'In development',
    statusNote: 'All modules exist as a working prototype. Finishing it for real use.',
    period: '2026 –',
    theme: 'product',
    summary:
      'An ERP for manufacturing plants. It started with corrugated box makers: orders, job cards, paper stock, dispatch, GST invoices and payroll in one system.',
    intro:
      'The box plants I visited ran on WhatsApp orders, paper job cards and an accounting package that knew nothing about the shop floor. THREXA puts all of that in one place.',
    links: [{ label: 'threxa.theingredientlist.co', href: 'https://threxa.theingredientlist.co/' }],
    stack: ['React', 'TypeScript', 'Vite', 'Supabase', 'PWA', 'Vercel'],
    cover: threxaOverview,
    thumb: threxaOverview,
    blocks: [
      {
        type: 'text',
        kicker: 'The problem',
        title: 'What the owner can’t see',
        body: [
          'A corrugated box plant takes each order through corrugation, printing, punching, pasting and dispatch. Paper comes in as reels, bought by GSM and bursting factor. In most plants I spoke to, orders arrive on WhatsApp, job cards are on paper, and stock is tracked by whoever is on shift.',
          'So simple questions need a phone call. Which machine stood idle? Which paper is running low? Where is this customer’s order? How much of today’s billing has actually been paid?',
        ],
      },
      { type: 'pair', items: [threxaMachines, threxaStock], note: 'Panels from the product film. All names and numbers are sample data.' },
      {
        type: 'text',
        kicker: 'Why not a generic ERP',
        title: 'The software has to use the plant’s own terms',
        body: [
          'General ERPs track items and units. A box plant thinks in ply, flute, board area in square feet, paper grade, and the wastage between stages. When the software doesn’t understand those, the real records end up in a notebook next to it.',
          'THREXA is built around reels and board, job cards and stages, and challans and e-way bills on every dispatch.',
        ],
      },
      {
        type: 'list',
        kicker: 'Modules',
        title: 'Thirteen modules sharing one set of records',
        columns: 3,
        items: [
          { name: 'Dashboard', body: 'Machines, stock, dispatch and cash on one screen for the owner.' },
          { name: 'Customers', body: 'Customer records that the rest of the system uses.' },
          { name: 'Quotations', body: 'Quotes, tracked until they turn into orders.' },
          { name: 'Orders', body: 'Order status a salesperson can read out on a call.' },
          { name: 'Production', body: 'Work orders and job cards, stage by stage, with machine, operator and output.' },
          { name: 'Products', body: 'Box specs, with a FEFCO style reference, flute profiles and ECT grades built in.' },
          { name: 'Inventory', body: 'Reel and board stock against reorder levels.' },
          { name: 'Dispatch', body: 'Schedules, challans, vehicles and e-way bills.' },
          { name: 'Invoices', body: 'GST invoices based on what was actually dispatched.' },
          { name: 'Employees', body: 'Shop-floor and office staff records.' },
          { name: 'Attendance', body: 'Who worked which shift.' },
          { name: 'Payroll', body: 'Wages for those shifts.' },
          { name: 'Cash Book', body: 'Money in and out, against what customers owe.' },
        ],
      },
      { type: 'media', media: threxaDispatch, layout: 'inset' },
      {
        type: 'text',
        kicker: 'Design',
        title: 'Made for phones and for the shop floor',
        body: [
          'Owners check on the factory from their phones, so THREXA has an installable mobile version with separate views for the owner, the supervisor and the driver. Each one only shows what that person needs to act on.',
          'Not everyone on the floor reads English, so the interface works in English, Kannada, Hindi and Tamil. All thirteen modules use the same components, so learning one screen means learning all of them.',
        ],
      },
      {
        type: 'media',
        media: {
          kind: 'diagram',
          id: 'threxa-flow',
          alt: 'The order path THREXA tracks: quotation, order, job card, corrugation, printing, punching, pasting, dispatch, invoice, cash.',
          caption: 'The path an order takes, from quotation to payment.',
        },
        layout: 'inset',
      },
      {
        type: 'facts',
        kicker: 'Stack',
        title: 'Plain, well-known technology',
        rows: [
          { label: 'Front end', value: 'React and TypeScript on Vite, with one shared component library' },
          { label: 'Data', value: 'Supabase (Postgres). The prototype started on local sample data and is moving across one module at a time.' },
          { label: 'Mobile', value: 'Installable web app with owner, supervisor and driver views' },
          { label: 'Languages', value: 'English, Kannada, Hindi, Tamil' },
          { label: 'Hosting', value: 'Vercel, deployed from GitHub on every push to main' },
        ],
      },
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
          alt: 'THREXA product film: four questions an owner can’t answer at 7 PM, each answered by a screen in THREXA, then the modules on a phone.',
          caption: 'The 43-second film I send to factory owners. Sample data.',
        },
      },
      {
        type: 'text',
        kicker: 'Selling it',
        title: 'The hard part has been sales',
        body: [
          'Factory owners don’t open links from people they don’t know. I switched to sending a short video file and walking into industrial estates in person.',
          'Pitching only to box plants got a lot of polite refusals. THREXA is now offered as a custom ERP for manufacturers in general, with the box plant version as the reference build.',
        ],
      },
      {
        type: 'status',
        kicker: 'Where it stands',
        title: 'Built so far, and what’s left',
        done: [
          'All thirteen module screens on one component library',
          'Mobile web app with owner, supervisor and driver views',
          'Interface in four languages',
          'FEFCO box style reference inside Products',
          'Product site and two demo films',
        ],
        next: ['Moving every module from sample data to live data', 'Finishing the end-to-end workflows', 'First install in a working plant'],
        note: 'No plant is running THREXA yet.',
      },
    ],
    related: ['sentra', 'papillon-interiors'],
    seo: {
      title: 'THREXA, manufacturing ERP · Sachin Kalaiselvan',
      description:
        'THREXA is the manufacturing ERP Sachin Kalaiselvan is building at The Ingredient List: production, paper stock, dispatch, GST invoicing and payroll for box plants and other manufacturers.',
    },
  },
  {
    slug: 'what-ra-sudeeep',
    index: '02',
    name: 'WHAT RA SUDEEEP?',
    category: 'Open-world game',
    role: 'Solo: direction, design, code',
    status: 'In development',
    statusNote: 'No public build yet.',
    period: '2026 –',
    theme: 'game',
    summary: 'An open-world driving and action game set in a fictional Bengaluru, with Kannada dialogue. In development for Android.',
    intro:
      'I want a game where Bengaluru’s traffic, streets and humour are the setting, played as a serious game rather than a parody.',
    links: [],
    stack: [],
    cover: {
      kind: 'diagram',
      id: 'city-plan',
      alt: 'Line drawing of a fictional Bengaluru district: a main road, a flyover, narrow lanes, a market and a lake.',
      caption: 'District sketch drawn for this page. It will be replaced with gameplay footage once there is a public build.',
    },
    thumb: { kind: 'diagram', id: 'city-plan', alt: 'Line drawing of a fictional Bengaluru district.' },
    blocks: [
      {
        type: 'text',
        kicker: 'The idea',
        title: 'An open-world game set somewhere like Bengaluru',
        body: [
          'Open-world games are nearly always set in American or European cities. This one is set in a city like Bengaluru: two-wheelers in every gap, autos stopping at the kerb, buses holding the left lane, flyovers that end without warning.',
          'The tone is realistic. The humour comes from the Kannada dialogue and the situations, not from cartoon visuals.',
        ],
      },
      {
        type: 'list',
        kicker: 'Systems',
        title: 'What I’m building',
        columns: 2,
        items: [
          { name: 'World', body: 'A fictional city made of familiar kinds of streets: main roads, markets, narrow residential lanes and flyovers. Real place names on the map.', state: 'In progress' },
          { name: 'Traffic', body: 'Traffic that behaves like Bengaluru traffic: loose lane discipline, two-wheelers filling gaps, buses and autos with their own habits.', state: 'In progress' },
          { name: 'Vehicles', body: 'The vehicles you actually see on the roads, with handling tuned for touch controls.', state: 'In progress' },
          { name: 'Characters and dialogue', body: 'Voice lines in Kannada. The jokes are in the writing.', state: 'In progress' },
          { name: 'Police and wanted level', body: 'Chases that play out through city streets rather than open highways.', state: 'Planned' },
          { name: 'Missions', body: 'Missions built on situations anyone who drives in Bengaluru will recognise.', state: 'Planned' },
        ],
      },
      {
        type: 'text',
        kicker: 'Visuals',
        title: 'From code-drawn shapes to real 3D assets',
        body: [
          'The first prototype ran in a browser with every shape generated in code. It was enough to test the idea, but it could never look like a real street, so I moved the project to proper 3D models and textures.',
          'Every shop sign, brand and character in the game is made up. Place names on the map are real.',
        ],
      },
      {
        type: 'facts',
        kicker: 'Technical direction',
        title: 'Phones first',
        rows: [
          { label: 'Platform', value: 'Android first, PC later' },
          { label: 'Rendering', value: '3D open world with real models and textures' },
          { label: 'Audio', value: 'Kannada voice lines' },
          { label: 'Target', value: 'Everything has to run on a mid-range Android phone' },
        ],
      },
      {
        type: 'text',
        kicker: 'Hard parts',
        title: 'A dense city on a mid-range phone',
        body: [
          'Bengaluru streets are packed with shops, signs, parked vehicles and people. That is expensive to draw on a phone, so a lot of the work is loading the city in pieces and deciding which details are worth keeping.',
          'The other risk is tone. It would be easy to slide into parody, and I don’t want that.',
        ],
      },
      { type: 'media', media: { kind: 'diagram', id: 'city-plan', alt: 'District sketch showing a main road, flyover, lanes and market.', caption: 'Street types the first district is built from. Illustration, not a game capture.' }, layout: 'full' },
      {
        type: 'status',
        kicker: 'Where it stands',
        title: 'Done so far, and next',
        done: ['Concept, tone and setting', 'Browser prototype with code-generated shapes', 'Move to real 3D models and textures', 'Made-up names for every brand, sign and character'],
        next: ['Driving and traffic running on a phone', 'First playable district', 'Gameplay footage for this page'],
        note: 'There is no public build yet.',
      },
    ],
    related: ['fitness-guild'],
    seo: {
      title: 'WHAT RA SUDEEEP?, open-world game in development · Sachin Kalaiselvan',
      description: 'An open-world driving and action game set in a fictional Bengaluru, with Kannada dialogue. In development for Android by Sachin Kalaiselvan.',
    },
  },
  {
    slug: 'sentra',
    index: '03',
    name: 'Sentra',
    category: 'Backend and automation',
    role: 'Design and build',
    status: 'Open source',
    period: '2026',
    theme: 'system',
    summary: 'Upload an invoice, a spreadsheet or a scanned page. Four agents read it, flag problems, raise tickets and keep a searchable record.',
    intro:
      'I built Sentra to see how much routine paperwork an agent pipeline can handle: read a document, spot what’s wrong, raise a ticket or a message, and wait for a person to approve anything risky.',
    links: [{ label: 'Source on GitHub', href: 'https://github.com/Sachin-kalaiselvan/sentra' }],
    stack: ['FastAPI', 'LangGraph', 'Celery', 'Redis', 'Qdrant', 'Groq · Llama 3.3 70B', 'Docker Compose', 'Prometheus', 'GitHub Actions'],
    cover: sentraResult,
    thumb: sentraResult,
    blocks: [
      {
        type: 'text',
        kicker: 'What it does',
        title: 'Reads business documents and decides what to do with them',
        body: [
          'Sentra accepts PDF, CSV, Word, Excel, plain text and images. It pulls out the content, works out what kind of document it is, lists anything that looks wrong, suggests actions, and stores the decision so similar documents can be found later.',
          'With the test invoice in the repo, it found that the invoice was overdue, the PO number was missing and one line item appeared twice. It marked the run high risk and held the Jira and Slack actions for approval.',
        ],
      },
      {
        type: 'media',
        media: {
          kind: 'diagram',
          id: 'sentra-pipeline',
          alt: 'Sentra pipeline: upload, then Extract, Reason, Act and Memory, with a branch that skips Act when nothing is recommended and an approval gate on high-risk actions.',
          caption: 'The agent graph as it’s written in app/graphs/workflow.py.',
        },
        layout: 'full',
      },
      {
        type: 'list',
        kicker: 'The agents',
        title: 'Four steps',
        columns: 2,
        items: [
          { name: 'Extract', body: 'Parses PDF, CSV, DOCX, XLSX and text, and reads images with OCR.' },
          { name: 'Reason', body: 'Sends the content to Llama 3.3 70B on Groq to classify it, rate the risk, list anomalies and suggest actions.' },
          { name: 'Act', body: 'Creates Jira tickets, sends email and posts to Slack. High-risk actions wait for approval.' },
          { name: 'Memory', body: 'Stores each decision in Qdrant so earlier documents can be searched by meaning.' },
        ],
      },
      { type: 'media', media: sentraRun, layout: 'full' },
      { type: 'media', media: sentraMemory, layout: 'full' },
      {
        type: 'text',
        kicker: 'How it’s built',
        title: 'Queued work, and a gate before anything risky',
        body: [
          'An upload returns a task ID straight away. The pipeline runs on Celery workers with Redis as the broker, and the dashboard polls for the result. The agents are wired together with LangGraph. If the reasoning step suggests no actions, or something fails, the run skips straight to memory.',
          'High-risk actions are held in Redis for 24 hours and only run when someone calls the approve endpoint. Jira and Slack are optional. If they aren’t set up, the run says so instead of crashing.',
        ],
      },
      {
        type: 'code',
        kicker: 'Example run',
        title: 'Output for the test invoice',
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
        note: 'Copied from the README of the repo.',
      },
      {
        type: 'facts',
        kicker: 'Services',
        title: 'What runs in the Docker Compose stack',
        rows: [
          { label: 'API', value: 'FastAPI on uvicorn: upload, status, approve, audit, memory search and metrics' },
          { label: 'Workers', value: 'Celery with a Redis broker, monitored with Flower' },
          { label: 'Agents', value: 'LangGraph state graph with conditional routing' },
          { label: 'Memory', value: 'Qdrant with all-MiniLM-L6-v2 embeddings' },
          { label: 'Monitoring', value: 'Prometheus metrics and structured logs' },
          { label: 'Database', value: 'PostgreSQL is in the stack, but the pipeline currently keeps its state in Redis and Qdrant' },
          { label: 'CI', value: 'GitHub Actions installs dependencies and checks every agent imports cleanly' },
        ],
      },
      {
        type: 'status',
        kicker: 'Where it stands',
        title: 'Works end to end on a laptop',
        done: ['Four-agent pipeline with conditional routing', 'Approval step for high-risk actions', 'Search over past decisions', 'Dashboard for uploads, history, approvals and search'],
        next: ['Keep run history in Postgres', 'Real tests beyond import checks'],
        note: 'Open source. It runs locally with Docker Compose and isn’t hosted anywhere.',
      },
    ],
    related: ['threxa'],
    seo: {
      title: 'Sentra, multi-agent document automation · Sachin Kalaiselvan',
      description: 'Sentra: a FastAPI, Celery, Redis, LangGraph and Qdrant pipeline where four agents read business documents, flag problems, act and remember. Built by Sachin Kalaiselvan.',
    },
  },
  {
    slug: 'fitness-guild',
    index: '04',
    name: 'Fitness Guild',
    category: 'Mobile app',
    role: 'Product, design, code',
    status: 'Released experiment',
    statusNote: 'Shelved in November 2026 after looking hard at the competition.',
    period: '2026',
    theme: 'app',
    summary: 'A fitness app where your gym is a guild, any kind of training counts, and guilds are ranked per active member.',
    intro:
      'Most fitness apps reward the people who already train the most. Fitness Guild (built under the name GymGuild) tried to reward groups that show up together.',
    links: [],
    stack: ['JavaScript', 'Vite', 'Capacitor', 'Android', 'Supabase', 'Edge Functions'],
    cover: guildWelcome,
    thumb: guildWelcome,
    blocks: [
      {
        type: 'text',
        kicker: 'The idea',
        title: 'Your gym as a team',
        body: [
          'People tend to train more for a group than for a personal streak. In Fitness Guild, your gym or a group of friends is a guild, and guilds compete over a season.',
          'Three rules shaped it. Every kind of training earns the same credit, so a swim counts as much as a lifting session. Guilds are scored per active member, so a small guild that turns up can beat a big one that doesn’t. Lifting ranks are adjusted for bodyweight.',
        ],
      },
      { type: 'phones', items: [guildWelcome, guildTrain, guildJoin], note: 'Onboarding screens from the Android build.' },
      {
        type: 'list',
        kicker: 'Details',
        title: 'Making the first day work',
        columns: 3,
        items: [
          { name: 'Starter guilds', body: 'If you skip choosing, you’re put in a guild with other new people in your city, so the boards aren’t empty on day one.' },
          { name: 'Seasons', body: 'Guilds climb a season leaderboard, so each session adds to something shared.' },
          { name: 'Live sessions', body: 'A native Android plugin shows a running session in the status bar: a timer chip on Android 16, a progress notification on older versions.' },
        ],
      },
      {
        type: 'facts',
        kicker: 'Fair scoring',
        title: 'Competition only works if people trust the scores',
        rows: [
          { label: 'App', value: 'Web app packaged for Android with Capacitor' },
          { label: 'Data', value: 'Supabase Postgres for profiles, guilds, gyms, activities, kudos, challenges and moderation, all behind row-level security' },
          { label: 'Logging', value: 'The app can’t write sessions or points directly. An Edge Function checks the user’s token and the Play Integrity verdict, then logs the activity.' },
          { label: 'Points', value: 'An append-only XP ledger. Every point has a row, and nothing else can add XP.' },
        ],
      },
      {
        type: 'text',
        kicker: 'Why I stopped',
        title: 'Strava and Cult.fit already do most of this',
        body: [
          'After release I looked properly at the competition. Gym communities, group challenges and leaderboards are already covered by Strava and Cult.fit, and a better scoring model isn’t a strong enough reason for people to move their training history.',
          'I shelved it rather than spend money on marketing. The server-checked scoring is the part I would reuse.',
        ],
      },
      {
        type: 'status',
        kicker: 'Where it stands',
        title: 'Released, then shelved',
        done: ['Android app with onboarding, guilds, competition and profiles', 'Server-checked activity logging', 'Live session notification'],
        next: [],
        note: 'Not in active development. I’m not claiming any user numbers.',
      },
    ],
    related: ['what-ra-sudeeep'],
    seo: {
      title: 'Fitness Guild, guild-based fitness app · Sachin Kalaiselvan',
      description: 'Fitness Guild (GymGuild): an Android app where gyms compete as guilds with fair, server-checked scoring. Released and then shelved. Built by Sachin Kalaiselvan.',
    },
  },
  {
    slug: 'papillon-interiors',
    index: '05',
    name: 'Papillon Interiors',
    category: 'Client website',
    role: 'Design and development',
    status: 'Client project',
    period: '2026',
    theme: 'client',
    summary: 'Website for Papillon Interiors, an interior design studio. Large room images, a gallery with a page per project, and a short path to an enquiry.',
    intro: 'Papillon Interiors needed a site that feels like their rooms: warm, calm and led by images, with an easy way to start a project.',
    links: [{ label: 'papllions.vercel.app', href: 'https://papllions.vercel.app/' }],
    stack: ['TanStack Start', 'React 19', 'Tailwind CSS', 'Framer Motion', 'Vercel'],
    cover: papHome,
    thumb: papHome,
    blocks: [
      {
        type: 'text',
        kicker: 'The work',
        title: 'What I built',
        body: [
          'The site has a home page, an about page, a gallery with a page for each project, and a contact page. Their tagline is “The Design You Desire”, so the type and colour are quiet and the images are large.',
          'I moved it off a site builder into its own codebase with server rendering, so pages load quickly and can be indexed by search engines.',
        ],
      },
      { type: 'pair', items: [papGallery, papProject], note: 'Captured from the site. The gallery images are placeholders, labelled as illustrative on the site, until finished projects are photographed.' },
      {
        type: 'facts',
        kicker: 'Build',
        title: 'How it’s made',
        rows: [
          { label: 'Framework', value: 'TanStack Start with server rendering on React 19' },
          { label: 'Styling', value: 'Tailwind CSS v4' },
          { label: 'Motion', value: 'Framer Motion' },
          { label: 'Hosting', value: 'Vercel' },
        ],
      },
      { type: 'phones', items: [papMobile] },
      {
        type: 'status',
        kicker: 'Where it stands',
        title: 'Live',
        done: ['Site with home, about, gallery, project pages and contact', 'Papillon’s logo and brand applied throughout'],
        next: ['Photos of finished projects in the gallery', 'A lead pipeline for the studio, built as a separate project'],
      },
    ],
    related: ['threxa'],
    seo: {
      title: 'Papillon Interiors website · Sachin Kalaiselvan',
      description: 'Website design and development for Papillon Interiors, an interior design studio. Client work by Sachin Kalaiselvan.',
    },
  },
];

/** Images shown in the home page reel, one per project, different from each feature image. */
export const reel: { slug: string; media: ImageMedia }[] = [
  { slug: 'threxa', media: threxaMachines },
  { slug: 'sentra', media: sentraResult },
  { slug: 'papillon-interiors', media: papHome },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
