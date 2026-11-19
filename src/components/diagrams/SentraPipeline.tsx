import { useId } from 'react';

interface NodeProps {
  x: number;
  y: number;
  w?: number;
  h?: number;
  title: string;
  sub: string;
  accent?: boolean;
}

function Node({ x, y, w = 172, h = 96, title, sub, accent }: NodeProps) {
  return (
    <g className={`sp-node${accent ? ' sp-node--accent' : ''}`}>
      <rect x={x} y={y} width={w} height={h} rx="2" />
      <text x={x + 16} y={y + 40} className="sp-title">{title}</text>
      <text x={x + 16} y={y + 68} className="sp-sub">{sub}</text>
    </g>
  );
}

const Arrow = ({ d, dashed, m }: { d: string; dashed?: boolean; m: string }) => (
  <path d={d} className={`sp-edge${dashed ? ' sp-edge--dashed' : ''}`} markerEnd={`url(#${m})`} />
);

/** Sentra's LangGraph pipeline, drawn from app/graphs/workflow.py. */
export function SentraPipeline({ label, className }: { label: string; className?: string }) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  const A = `sp-arrow-${u}`, AN = `sp-arrow-n-${u}`, G = `sp-grid-${u}`;
  return (
    <div className={className}>
      {/* Wide layout */}
      <svg className="sp sp--wide" viewBox="0 0 1200 540" role="img" aria-label={label}>
        <defs>
          <marker id={A} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className="sp-arrowhead" />
          </marker>
          <pattern id={G} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" className="sp-gridline" />
          </pattern>
        </defs>
        <rect width="1200" height="540" fill={`url(#${G})`} className="sp-bg" />

        <text x="40" y="52" className="sp-label">POST /upload → 202 + task_id</text>
        <text x="1160" y="52" textAnchor="end" className="sp-label">GET /status/{'{task_id}'}</text>

        <Node x={40} y={200} w={140} title="Upload" sub="any document" />
        <Node x={240} y={200} title="Extract" sub="PDF · DOCX · XLSX · OCR" />
        <Node x={472} y={200} title="Reason" sub="classify · risk · anomalies" accent />
        <Node x={704} y={200} title="Act" sub="Jira · email · Slack" />
        <Node x={936} y={200} title="Memory" sub="embed decision" />

        <Arrow d="M180 248 H236" m={A} />
        <Arrow d="M412 248 H468" m={A} />
        <Arrow d="M644 248 H700" m={A} />
        <Arrow d="M876 248 H932" m={A} />
        <Arrow d="M1108 248 H1150" m={A} />
        <circle cx="1162" cy="248" r="8" className="sp-end" />

        {/* conditional edge */}
        <Arrow d="M558 296 V340 Q558 362 580 362 H998 Q1022 362 1022 340 V300" dashed m={A} />
        <text x="790" y="388" textAnchor="middle" className="sp-label">no actions recommended, or an error → skip to memory</text>

        {/* approval gate */}
        <rect x="704" y="96" width="172" height="58" rx="2" className="sp-gate" />
        <text x="720" y="122" className="sp-gate-title">Approval gate</text>
        <text x="720" y="142" className="sp-sub">high risk waits · Redis · 24 h</text>
        <path d="M790 154 V196" className="sp-edge sp-edge--dashed" />
        <text x="886" y="130" className="sp-label">POST /approve/{'{task_id}'}</text>

        {/* services rail */}
        <path d="M40 452 H1160" className="sp-rail" />
        <text x="40" y="490" className="sp-label">Celery workers · Redis broker</text>
        <path d="M558 296 V300 M558 438 V452" className="sp-tick" />
        <text x="558" y="490" textAnchor="middle" className="sp-label">Groq · Llama 3.3 70B</text>
        <path d="M1022 438 V452" className="sp-tick" />
        <text x="1160" y="490" textAnchor="end" className="sp-label">Qdrant · MiniLM-L6 embeddings</text>
      </svg>

      {/* Narrow layout */}
      <svg className="sp sp--narrow" viewBox="0 0 360 820" role="img" aria-label={label}>
        <defs>
          <marker id={AN} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className="sp-arrowhead" />
          </marker>
        </defs>
        <text x="20" y="28" className="sp-label">POST /upload → task_id</text>
        {[
          ['Upload', 'any document', false],
          ['Extract', 'PDF · DOCX · XLSX · OCR', false],
          ['Reason', 'classify · risk · anomalies', true],
          ['Act', 'Jira · email · Slack', false],
          ['Memory', 'embed decision · Qdrant', false],
        ].map(([t, s, a], i) => (
          <g key={t as string}>
            <Node x={20} y={56 + i * 148} w={230} h={92} title={t as string} sub={s as string} accent={a as boolean} />
            {i < 4 && <path d={`M135 ${148 + i * 148} V${200 + i * 148}`} className="sp-edge" markerEnd={`url(#${AN})`} />}
          </g>
        ))}
        <path d="M250 400 H300 Q318 400 318 418 V676 Q318 694 300 694 H254" className="sp-edge sp-edge--dashed" markerEnd={`url(#${AN})`} />
        <text x="332" y="560" className="sp-label" transform="rotate(90 332 560)" textAnchor="middle">no actions → memory</text>
        <text x="20" y="800" className="sp-label">high-risk actions wait for POST /approve</text>
      </svg>
    </div>
  );
}
