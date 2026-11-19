const office = ['Quotation', 'Order', 'Job card'];
const floor = ['Corrugation', 'Printing', 'Punching', 'Pasting'];
const after = ['Dispatch', 'Invoice', 'Cash'];

/** The order path THREXA models. Built in HTML so it reflows on narrow screens. */
export function ThrexaFlow({ label, className }: { label: string; className?: string }) {
  let n = 0;
  const step = (name: string) => {
    n += 1;
    return (
      <li className="flow__step" key={name} style={{ ['--i' as string]: n }}>
        <span className="flow__n mono">{String(n).padStart(2, '0')}</span>
        <span className="flow__name">{name}</span>
      </li>
    );
  };
  return (
    <div className={className} role="img" aria-label={label}>
      <div className="flow" aria-hidden="true">
        <div className="flow__group">
          <span className="flow__label mono">Office</span>
          <ol className="flow__list">{office.map(step)}</ol>
        </div>
        <div className="flow__group flow__group--floor">
          <span className="flow__label mono">Shop floor</span>
          <ol className="flow__list">{floor.map(step)}</ol>
        </div>
        <div className="flow__group">
          <span className="flow__label mono">Out the gate</span>
          <ol className="flow__list">{after.map(step)}</ol>
        </div>
      </div>
    </div>
  );
}
