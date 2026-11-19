import { useEffect } from 'react';
import { Page } from '../components/Page';
import { Hero } from '../components/Hero';
import { WorkIndex } from '../components/WorkIndex';
import { Features } from '../components/Features';
import { About, Capabilities, Contact, Experiments, SectionHead } from '../components/Sections';
import { navigation } from '../content/capabilities';
import { projects } from '../content/projects';
import { SECTION_EVENT } from '../lib/sections';

/** Tell the navigation which section is currently in the reading zone. */
function useActiveSection() {
  useEffect(() => {
    const ids = navigation.map((n) => n.id);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const visible = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => visible.set(e.target.id, e.isIntersecting));
        const current = ids.find((id) => visible.get(id)) ?? null;
        window.dispatchEvent(new CustomEvent(SECTION_EVENT, { detail: current }));
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      window.dispatchEvent(new CustomEvent(SECTION_EVENT, { detail: null }));
    };
  }, []);
}

export default function Home() {
  useActiveSection();
  return (
    <Page className="home">
      <Hero />
      <section className="section work" id="work" aria-labelledby="work-title">
        <div className="wrap">
          <SectionHead
            no="01"
            label={`${projects.length} projects, with their current status`}
            id="work-title"
            lines={['Selected work']}
          />
          <WorkIndex />
        </div>
        <Features />
      </section>
      <About />
      <Capabilities />
      <Experiments />
      <Contact />
    </Page>
  );
}
