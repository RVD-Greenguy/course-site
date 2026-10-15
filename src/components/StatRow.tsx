export interface Stat {
  label: string;
  value: string;
}

export default function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="stat-row">
      {stats.map((s) => (
        <div key={s.label} className="stat-tile">
          <div className="stat-label">{s.label}</div>
          <div className="stat-value">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
