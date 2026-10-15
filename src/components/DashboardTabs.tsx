import { useState, type ReactNode } from "react";

export interface DashboardTab {
  id: string;
  label: string;
  badge?: string;
  content: ReactNode;
}

export default function DashboardTabs({
  tabs,
  defaultTab,
}: {
  tabs: DashboardTab[];
  defaultTab?: string;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="dashboard">
      <div className="dashboard-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`dashboard-tab${t.id === activeTab.id ? " active" : ""}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
            {t.badge && <span className="dashboard-tab-badge">{t.badge}</span>}
          </button>
        ))}
      </div>
      <div className="dashboard-panel fade-in" key={activeTab.id}>
        {activeTab.content}
      </div>
    </div>
  );
}
