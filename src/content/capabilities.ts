/** Capabilities, each backed by work on this site. `proof` names the project that shows it. */
export const capabilities = [
  {
    group: 'Product',
    items: [
      { name: 'Business problem analysis', proof: 'THREXA' },
      { name: 'Product architecture', proof: 'THREXA' },
      { name: 'MVPs that ship', proof: 'Fitness Guild' },
      { name: 'Market and competitor research', proof: 'Fitness Guild' },
    ],
  },
  {
    group: 'Software',
    items: [
      { name: 'Web applications', proof: 'THREXA' },
      { name: 'Backend systems and queues', proof: 'Sentra' },
      { name: 'Databases and access rules', proof: 'Fitness Guild' },
      { name: 'Workflow automation', proof: 'Sentra' },
      { name: 'API integrations', proof: 'Sentra' },
    ],
  },
  {
    group: 'Design',
    items: [
      { name: 'Product interfaces', proof: 'THREXA' },
      { name: 'Website experiences', proof: 'Papillon Interiors' },
      { name: 'Interaction and motion', proof: 'This site' },
      { name: 'Multilingual interfaces', proof: 'THREXA' },
    ],
  },
  {
    group: 'Interactive',
    items: [
      { name: 'Game development', proof: 'WHAT RA SUDEEEP?' },
      { name: 'Real-time 3D', proof: 'WHAT RA SUDEEEP?' },
      { name: 'Mobile games', proof: 'Core Blocks' },
    ],
  },
];

export const navigation = [
  { id: 'work', label: 'Selected work', href: '/#work' },
  { id: 'about', label: 'About', href: '/#about' },
  { id: 'experiments', label: 'Experiments', href: '/#experiments' },
  { id: 'contact', label: 'Contact', href: '/#contact' },
];
