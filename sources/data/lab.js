// Sachin's smaller builds and experiments. Where there is no public link, the board says so.
const card = (key) => ({ image: `sk-${key}.png`, imageMini: `sk-${key}-mini.png` })
export default [
    { title: 'WHAT RA SUDEEEP?', url: '', ...card('wrs') },
    { title: 'Bengaluru: Traffic Life', url: '', ...card('traffic-life') },
    { title: 'Core Blocks', url: 'https://apps.theingredientlist.co/coreblocks', ...card('core-blocks') },
    { title: 'Gridlock Arrows', url: 'https://play.google.com/store/apps/details?id=co.theingredientlist.arrowout', ...card('gridlock-arrows') },
    { title: 'Box costing calculator', url: 'https://boxcalc.theingredientlist.co', ...card('box-costing') },
    { title: 'Borrower Risk Intelligence', url: 'https://huggingface.co/spaces/SachinK011/borrower-risk-intelligence', ...card('borrower-risk') },
    { title: 'Financial Document Analyzer', url: 'https://huggingface.co/spaces/SachinK011/financial-document-analyzer', ...card('fin-docs') },
    { title: 'Credit Scoring API', url: 'https://github.com/Sachin-kalaiselvan/credit-scoring-api', ...card('credit-api') },
    { title: 'Job application pipeline', url: '', ...card('job-pipeline') },
    { title: 'Papillon lead pipeline', url: 'https://github.com/Sachin-kalaiselvan/papillon-leads', ...card('lead-pipeline') },
    { title: 'J.K. Padmalaya booking', url: '', ...card('padmalaya') },
    { title: 'Gridshot', url: '', ...card('gridshot') },
    { title: 'QuantaGrid', url: 'https://github.com/Sachin-kalaiselvan/quantagrid', ...card('quantagrid') },
]
