import { useEffect, useRef, useState } from "react";

export interface FlowStep {
  label: string;
  detail?: string;
}

export function useStepPlayer(steps: FlowStep[], stepDurationMs = 1100) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function play() {
    if (timer.current) clearTimeout(timer.current);
    setPlaying(true);
    let i = 0;
    setActiveIndex(0);
    const tick = () => {
      i += 1;
      if (i >= steps.length) {
        setPlaying(false);
        return;
      }
      setActiveIndex(i);
      timer.current = setTimeout(tick, stepDurationMs);
    };
    timer.current = setTimeout(tick, stepDurationMs);
  }

  function reset() {
    if (timer.current) clearTimeout(timer.current);
    setPlaying(false);
    setActiveIndex(-1);
  }

  return { activeIndex, playing, play, reset };
}

export default function AnimatedFlow({
  steps,
  activeIndex,
}: {
  steps: FlowStep[];
  activeIndex: number;
}) {
  return (
    <div className="flow-step">
      {steps.map((s, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            className={
              "flow-node" + (i === activeIndex ? " active" : i < activeIndex ? " done" : "")
            }
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <span className={"flow-arrow" + (i === activeIndex ? " active" : "")}>→</span>
          )}
        </span>
      ))}
    </div>
  );
}
