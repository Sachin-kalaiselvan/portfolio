import { useEffect, useRef, useState } from 'react';
import type { ImageMedia, Media as MediaT, VideoMedia } from '../content/types';
import { Diagram } from './diagrams';

interface PictureProps {
  media: ImageMedia;
  sizes?: string;
  eager?: boolean;
  className?: string;
}

export function Picture({ media, sizes = '100vw', eager, className }: PictureProps) {
  const srcSet = media.widths.map((w) => `/media/${media.base}-${w}.webp ${w}w`).join(', ');
  const fallback = `/media/${media.base}-${media.widths[media.widths.length - 1]}.webp`;
  return (
    <img
      className={className}
      src={fallback}
      srcSet={srcSet}
      sizes={sizes}
      width={media.width}
      height={media.height}
      alt={media.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : undefined}
    />
  );
}

/**
 * Video that never auto-downloads on phones, slow connections or with reduced
 * motion. On capable desktops it plays muted while on screen and pauses when
 * scrolled away. Everywhere else the poster shows with a play control.
 */
export function Video({ media, className }: { media: VideoMedia; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [auto, setAuto] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const ok =
      window.matchMedia('(min-width: 900px) and (hover: hover)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      !conn?.saveData;
    setAuto(ok);
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v || !auto) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (v.preload !== 'auto') v.preload = 'auto';
          v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        } else {
          v.pause();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [auto]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.preload = 'auto';
      v.play().then(() => setPlaying(true)).catch(() => setFailed(true));
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div className={`video ${className ?? ''}`} data-playing={playing || undefined}>
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        poster={media.poster}
        width={media.width}
        height={media.height}
        aria-label={media.alt}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onError={() => setFailed(true)}
      >
        {media.sources.map((s) => (
          <source key={s.src} src={s.src} type={s.type} />
        ))}
      </video>
      {!failed && (
        <button type="button" className="video__toggle mono" onClick={toggle} aria-label={playing ? 'Pause video' : 'Play video'}>
          <span className="video__icon" aria-hidden="true" data-state={playing ? 'pause' : 'play'} />
          <span>{playing ? 'Pause' : 'Play'}</span>
        </button>
      )}
    </div>
  );
}

interface MediaProps {
  media: MediaT;
  sizes?: string;
  eager?: boolean;
  className?: string;
}

export function Media({ media, sizes, eager, className }: MediaProps) {
  if (media.kind === 'image') return <Picture media={media} sizes={sizes} eager={eager} className={className} />;
  if (media.kind === 'video') return <Video media={media} className={className} />;
  return <Diagram id={media.id} label={media.alt} className={className} />;
}

/** Media with a masked reveal and an optional caption. */
export function Figure({
  media,
  sizes,
  eager,
  className,
  frameClass,
}: MediaProps & { frameClass?: string }) {
  return (
    <figure className={`figure ${className ?? ''}`}>
      <div className={`figure__frame rv-mask ${frameClass ?? ''}`} data-kind={media.kind}>
        <div className="figure__inner">
          <Media media={media} sizes={sizes} eager={eager} />
        </div>
      </div>
      {'caption' in media && media.caption && <figcaption className="figure__cap mono mono--plain muted">{media.caption}</figcaption>}
    </figure>
  );
}
