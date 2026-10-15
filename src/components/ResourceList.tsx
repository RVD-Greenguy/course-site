export interface Resource {
  title: string;
  url: string;
  desc: string;
  headings?: string[];
  summary?: string;
  howTo?: string;
}

export default function ResourceList({ resources }: { resources: Resource[] }) {
  return (
    <ul className="link-list resource-list">
      {resources.map((r) => (
        <li key={r.url}>
          <a href={r.url} target="_blank" rel="noreferrer">{r.title}</a>
          <span className="desc">{r.desc}</span>
          {r.headings && r.headings.length > 0 && (
            <div className="resource-headings">
              {r.headings.map((h) => (
                <span key={h} className="resource-heading-chip">{h}</span>
              ))}
            </div>
          )}
          {r.summary && <p className="resource-summary">{r.summary}</p>}
          {r.howTo && (
            <p className="resource-howto">
              <strong>How to:</strong> {r.howTo}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
