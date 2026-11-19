import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { projects } from '../content/projects';
import { useFinePointer, useReducedMotion } from '../lib/hooks';
import { Media } from './Media';

/**
 * Signature interaction: a typographic project index. On desktop a preview of
 * each project follows the cursor and swaps as you move between rows.
 */
export function WorkIndex() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!fine) return;
    const el = preview.current;
    const list = listRef.current;
    if (!el || !list) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, first = true;
    const loop = () => {
      const k = reduced ? 1 : 0.16;
      x += (tx - x) * k;
      y += (ty - y) * k;
      const tilt = reduced ? 0 : Math.max(-6, Math.min(6, (tx - x) * 0.04));
      el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${tilt}deg)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX + 28;
      ty = e.clientY - 120;
      if (first) {
        x = tx;
        y = ty;
        first = false;
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onLeave = () => {
      first = true;
    };
    list.addEventListener('pointermove', onMove, { passive: true });
    list.addEventListener('pointerleave', onLeave);
    return () => {
      list.removeEventListener('pointermove', onMove);
      list.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [fine, reduced]);

  return (
    <div className="windex" onPointerLeave={() => setHover(null)}>
      <div className="windex__head mono muted" aria-hidden="true">
        <span>No.</span>
        <span>Project</span>
        <span className="windex__col-cat">Category</span>
        <span className="windex__col-status">Status</span>
        <span className="windex__col-year">Year</span>
      </div>
      <ol className="windex__list" ref={listRef}>
        {projects.map((p, i) => (
          <li key={p.slug} className="windex__item rv" style={{ ['--i' as string]: i }} data-dim={hover !== null && hover !== i ? '' : undefined}>
            <Link
              to={`/work/${p.slug}`}
              className="windex__row"
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            >
              <span className="windex__no mono">{p.index}</span>
              <span className="windex__name">
                <span className="windex__name-text">{p.name}</span>
                {p.parent && <span className="windex__parent mono muted">{p.parent}</span>}
              </span>
              <span className="windex__cat">{p.category}</span>
              <span className="windex__status mono">
                <span className="status" data-s={p.status}>{p.status}</span>
              </span>
              <span className="windex__year mono muted">{p.period}</span>
              <span className="windex__go" aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ol>

      {fine && (
        <div className="windex__preview" ref={preview} aria-hidden="true" data-visible={hover !== null || undefined}>
          {projects.map((p, i) => (
            <div key={p.slug} className="windex__card" data-on={hover === i || undefined} data-kind={p.thumb.kind}>
              <Media media={p.thumb} sizes="360px" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
