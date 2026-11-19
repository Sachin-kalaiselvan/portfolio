export type Status =
  | 'Live'
  | 'In development'
  | 'Released experiment'
  | 'Concept'
  | 'Client project'
  | 'Open source'
  | 'Hackathon entry';

/** A raster image prepared by scripts/prepare-media.py: /media/{base}-{width}.webp */
export interface ImageMedia {
  kind: 'image';
  base: string;
  widths: number[];
  width: number;
  height: number;
  alt: string;
  caption?: string;
}

export interface VideoMedia {
  kind: 'video';
  sources: { src: string; type: string }[];
  poster: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
}

/** A diagram drawn in code (see components/diagrams). Never presented as a screenshot. */
export interface DiagramMedia {
  kind: 'diagram';
  id: 'sentra-pipeline' | 'city-plan' | 'threxa-flow';
  alt: string;
  caption?: string;
}

export type Media = ImageMedia | VideoMedia | DiagramMedia;

export type Block =
  | { type: 'text'; kicker: string; title: string; body: string[] }
  | { type: 'media'; media: Media; layout?: 'full' | 'inset' | 'tall' }
  | { type: 'pair'; items: [Media, Media]; note?: string }
  | { type: 'phones'; items: ImageMedia[]; note?: string }
  | { type: 'list'; kicker: string; title: string; items: { name: string; body: string; state?: string }[]; columns?: 2 | 3 }
  | { type: 'facts'; kicker: string; title: string; rows: { label: string; value: string }[] }
  | { type: 'status'; kicker: string; title: string; done: string[]; next: string[]; note?: string }
  | { type: 'code'; kicker: string; title: string; label: string; code: string; note?: string }
  | { type: 'pull'; text: string };

export type Theme = 'product' | 'game' | 'system' | 'app' | 'client';

export interface Project {
  slug: string;
  index: string;
  name: string;
  /** e.g. 'The Ingredient List' for THREXA */
  parent?: string;
  category: string;
  role: string;
  status: Status;
  statusNote?: string;
  period?: string;
  theme: Theme;
  /** One sentence for the index list */
  summary: string;
  /** Opening line of the case study */
  intro: string;
  links: { label: string; href: string }[];
  /** Only technologies verified in the repository or product */
  stack: string[];
  cover: Media;
  /** Small preview used by the cursor-following index */
  thumb: Media;
  blocks: Block[];
  related: string[];
  seo: { title: string; description: string };
}

export interface Experiment {
  name: string;
  kind: string;
  status: Status | 'Experiment';
  body: string;
  link?: { label: string; href: string };
  year?: string;
}
