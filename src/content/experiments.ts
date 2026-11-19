import type { Experiment } from './types';

/** Smaller builds, prototypes and explorations. Kept apart from selected work on purpose. */
export const experiments: Experiment[] = [
  {
    name: 'Core Blocks',
    kind: 'Mobile game',
    status: 'Live',
    body: 'A block puzzle published on Google Play under The Ingredient List. Short sessions, quick restarts, monetised with optional rewarded video rather than forced interruptions.',
    year: '2026',
  },
  {
    name: 'Gridlock Arrows',
    kind: 'Mobile game',
    status: 'Live',
    body: 'Tap-to-escape arrow puzzle on Google Play. Each game I publish gets its own visual identity rather than a shared template.',
    link: { label: 'Google Play', href: 'https://play.google.com/store/apps/details?id=co.theingredientlist.arrowout' },
    year: '2026',
  },
  {
    name: 'Box costing calculator',
    kind: 'Free tool',
    status: 'Live',
    body: 'A free costing calculator for corrugated box makers. Built as a standalone static site to start useful conversations with manufacturers.',
    link: { label: 'boxcalc.theingredientlist.co', href: 'https://boxcalc.theingredientlist.co' },
    year: '2026',
  },
  {
    name: 'Bengaluru: Traffic Life',
    kind: 'Unity prototype',
    status: 'In development',
    body: 'Unity 6 and URP foundation for a touchscreen driving sim: editor tooling that generates the scooter prefab and test scene from code, an input map, and a documented build pipeline for Android.',
    year: '2026',
  },
  {
    name: 'Studio lead pipeline',
    kind: 'Automation',
    status: 'In development',
    body: 'A crawler that finds residential interior enquiries for a design studio and qualifies them over WhatsApp, running on my own server instead of buying leads per head.',
    year: '2026',
  },
  {
    name: 'Gridshot',
    kind: 'Mobile utility',
    status: 'In development',
    body: 'Photograph a printed table, get a spreadsheet back. Picked from a market-research pass over a long list of app ideas.',
    year: '2026',
  },
  {
    name: 'QuantaGrid',
    kind: 'Research prototype',
    status: 'Hackathon entry',
    body: 'Entry to Google’s Gemma 3n challenge on Kaggle: a distributed MatFormer mesh built over the challenge window.',
    link: { label: 'Source', href: 'https://github.com/Sachin-kalaiselvan/quantagrid' },
    year: '2025',
  },
];
