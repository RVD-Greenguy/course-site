import { useState } from "react";
import { citiesSample } from "../data/citiesSample";
import Evidence from "../components/Evidence";

export default function ToolBuildingSandbox() {
  const [city, setCity] = useState("Tokyo");
  const [result, setResult] = useState<{ latitude: number; longitude: number; temperature: number; unit: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runTools() {
    setLoading(true);
    setError(null);
    setResult(null);
    const match = citiesSample.find((c) => c.city.toLowerCase() === city.trim().toLowerCase());
    if (!match) {
      setError(`"${city}" isn't in this demo's small city list — try one of: ${citiesSample.map((c) => c.city).join(", ")}`);
      setLoading(false);
      return;
    }
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${match.latitude}&longitude=${match.longitude}&current=temperature_2m`;
      const res = await fetch(url);
      const j = await res.json();
      if (!res.ok) throw new Error(j.reason || "Request failed");
      setResult({
        latitude: match.latitude,
        longitude: match.longitude,
        temperature: j.current.temperature_2m,
        unit: j.current_units.temperature_2m,
      });
    } catch {
      setError("Couldn't reach Open-Meteo — check your network connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sandbox">
      <h4>Live demo — get_latlng + get_temperature, running for real</h4>
      <Evidence
        kind="course"
        source="chuk_day04-tools-blank.ipynb — get_latlng / get_temperature"
        note="Reproduces the notebook's two @tool functions directly in the browser: a city lookup (against a small bundled sample of the course's cities_latlng.csv) feeding a real, live fetch() to the exact same Open-Meteo endpoint the Python tool calls."
      />
      <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City name, e.g. Tokyo"
          style={{ flex: 1 }}
        />
        <button onClick={runTools} disabled={loading}>
          {loading ? "Running…" : "Run tools"}
        </button>
      </div>
      {error && <p style={{ color: "var(--accent-4)", fontSize: 13 }}>{error}</p>}
      {result && (
        <div style={{ fontSize: 13 }}>
          <div><code>get_latlng('{city}')</code> → lat {result.latitude}, lon {result.longitude}</div>
          <div style={{ marginTop: 6 }}>
            <code>get_temperature({result.latitude}, {result.longitude})</code> →{" "}
            <strong style={{ color: "var(--accent-2)" }}>{result.temperature}{result.unit}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
