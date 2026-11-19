import type { Experiment } from './types';

/** Smaller builds, prototypes and explorations. Kept apart from selected work on purpose. */
export const experiments: Experiment[] = [
  {
    name: 'Core Blocks',
    kind: 'Mobile game',
    status: 'Live',
    body: 'Block puzzle on Google Play, published under The Ingredient List. Ads are optional rewarded videos, not forced breaks.',
    year: '2026',
  },
  {
    name: 'Gridlock Arrows',
    kind: 'Mobile game',
    status: 'Live',
    body: 'Arrow-escape puzzle on Google Play, published under The Ingredient List.',
    link: { label: 'Google Play', href: 'https://play.google.com/store/apps/details?id=co.theingredientlist.arrowout' },
    year: '2026',
  },
  {
    name: 'Box costing calculator',
    kind: 'Free tool',
    status: 'Live',
    body: 'Free costing calculator for corrugated box makers. A simple way to start conversations with plant owners.',
    link: { label: 'boxcalc.theingredientlist.co', href: 'https://boxcalc.theingredientlist.co' },
    year: '2026',
  },
  {
    name: 'Bengaluru: Traffic Life',
    kind: 'Unity prototype',
    status: 'In development',
    body: 'Unity 6 project setup for a Bengaluru driving game on Android: a scooter and test scene generated from code, touch input, and a scripted Android build.',
    year: '2026',
  },
  {
    name: 'Lead pipeline for a design studio',
    kind: 'Automation',
    status: 'In development',
    body: 'Finds people looking for home interior work and follows up over WhatsApp, for a design studio. Runs on my own server instead of buying leads.',
    year: '2026',
  },
  {
    name: 'Gridshot',
    kind: 'Mobile utility',
    status: 'In development',
    body: 'Take a photo of a printed table and get a spreadsheet back.',
    year: '2026',
  },
  {
    name: 'QuantaGrid',
    kind: 'Research prototype',
    status: 'Hackathon entry',
    body: 'My entry to Google’s Gemma 3n challenge on Kaggle: a distributed MatFormer mesh.',
    link: { label: 'Source', href: 'https://github.com/Sachin-kalaiselvan/quantagrid' },
    year: '2025',
  },
];
