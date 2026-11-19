import type { ElementType, ReactNode } from 'react';

interface Props {
  as?: ElementType;
  lines: ReactNode[];
  className?: string;
  /** Stagger offset added to every line index */
  offset?: number;
  id?: string;
}

/**
 * Art-directed multi-line heading. Each line is masked and slides up into place
 * when revealed. Line breaks are explicit so the composition never depends on
 * the browser's wrapping.
 */
export function Lines({ as: Tag = 'h2', lines, className, offset = 0, id }: Props) {
  return (
    <Tag className={className} id={id}>
      {lines.map((line, i) => (
        <span className="rv-line" key={i} style={{ ['--i' as string]: i + offset }}>
          <span>{line}</span>
        </span>
      ))}
    </Tag>
  );
}
