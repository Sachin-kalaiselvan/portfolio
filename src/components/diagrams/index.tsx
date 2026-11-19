import type { DiagramMedia } from '../../content/types';
import { CityPlan } from './CityPlan';
import { SentraPipeline } from './SentraPipeline';
import { ThrexaFlow } from './ThrexaFlow';

export function Diagram({ id, label, className }: { id: DiagramMedia['id']; label: string; className?: string }) {
  const cls = `diagram diagram--${id} ${className ?? ''}`;
  if (id === 'sentra-pipeline') return <SentraPipeline label={label} className={cls} />;
  if (id === 'city-plan') return <CityPlan label={label} className={cls} />;
  return <ThrexaFlow label={label} className={cls} />;
}
