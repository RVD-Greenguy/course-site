import { useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Evidence from "../components/Evidence";

// Direct TS port of cart_pole_qlearning.py's physics + linear Q-learning —
// same state/action space, same decay schedule, same TD update.
const GRAVITY = 9.8;
const MASSCART = 1.0;
const MASSPOLE = 0.1;
const TOTAL_MASS = MASSCART + MASSPOLE;
const LENGTH = 0.5; // half the pole's length
const POLEMASS_LENGTH = MASSPOLE * LENGTH;
const FORCE_MAG = 10.0;
const TAU = 0.02; // seconds between state updates
const THETA_THRESHOLD = (12 * Math.PI) / 180;
const X_THRESHOLD = 2.4;
const MAX_STEPS = 500;

type CartState = [number, number, number, number]; // x, x_dot, theta, theta_dot

function stepPhysics(state: CartState, action: 0 | 1): { state: CartState; done: boolean } {
  const [x, xDot, theta, thetaDot] = state;
  const force = action === 1 ? FORCE_MAG : -FORCE_MAG;
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);

  const temp = (force + POLEMASS_LENGTH * thetaDot * thetaDot * sinTheta) / TOTAL_MASS;
  const thetaAcc =
    (GRAVITY * sinTheta - cosTheta * temp) /
    (LENGTH * (4.0 / 3.0 - (MASSPOLE * cosTheta * cosTheta) / TOTAL_MASS));
  const xAcc = temp - (POLEMASS_LENGTH * thetaAcc * cosTheta) / TOTAL_MASS;

  const newX = x + TAU * xDot;
  const newXDot = xDot + TAU * xAcc;
  const newTheta = theta + TAU * thetaDot;
  const newThetaDot = thetaDot + TAU * thetaAcc;

  const done =
    newX < -X_THRESHOLD || newX > X_THRESHOLD || newTheta < -THETA_THRESHOLD || newTheta > THETA_THRESHOLD;

  return { state: [newX, newXDot, newTheta, newThetaDot], done };
}

function randomInitState(): CartState {
  return [0, 0, 0, 0].map(() => (Math.random() - 0.5) * 0.1) as CartState;
}

export default function CartPoleSandbox() {
  const [alpha, setAlpha] = useState(0.001);
  const [gamma, setGamma] = useState(0.99);
  const [decayRate, setDecayRate] = useState(0.01);
  const [running, setRunning] = useState(false);
  const [episode, setEpisode] = useState(0);
  const [rewards, setRewards] = useState<{ episode: number; reward: number }[]>([]);

  const weightsRef = useRef<number[][]>([[0, 0], [0, 0], [0, 0], [0, 0]]);
  const biasRef = useRef<number[]>([0, 0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  function predictQ(state: CartState): [number, number] {
    const w = weightsRef.current;
    const b = biasRef.current;
    let q0 = b[0], q1 = b[1];
    for (let i = 0; i < 4; i++) {
      q0 += state[i] * w[i][0];
      q1 += state[i] * w[i][1];
    }
    return [q0, q1];
  }

  function policy(state: CartState, eps: number): 0 | 1 {
    if (Math.random() > eps) {
      const [q0, q1] = predictQ(state);
      return q1 > q0 ? 1 : 0;
    }
    return Math.random() < 0.5 ? 0 : 1;
  }

  function drawCart(state: CartState) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const scale = width / (2 * X_THRESHOLD * 1.4);
    const cx = width / 2 + state[0] * scale;
    const groundY = height * 0.7;

    ctx.strokeStyle = "#2a2f3a";
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    ctx.fillStyle = "#7c9eff";
    ctx.fillRect(cx - 25, groundY - 15, 50, 30);

    const poleLen = 80;
    const tipX = cx + Math.sin(state[2]) * poleLen;
    const tipY = groundY - 15 - Math.cos(state[2]) * poleLen;
    ctx.strokeStyle = "#f0a860";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, groundY - 15);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  function runEpisode(ep: number) {
    const eps = 0.02 + (1.0 - 0.02) * Math.exp(-ep * decayRate);
    let state = randomInitState();
    let action = policy(state, eps);
    let totalReward = 0;
    let steps = 0;

    function frame() {
      const { state: newState, done: physDone } = stepPhysics(state, action);
      steps += 1;
      totalReward += 1;
      const done = physDone || steps >= MAX_STEPS;

      let tdTarget: number;
      let nextAction: 0 | 1 = action;
      if (done) {
        tdTarget = physDone && totalReward < MAX_STEPS ? -1.0 : 1.0;
      } else {
        nextAction = policy(newState, eps);
        const [q0, q1] = predictQ(newState);
        tdTarget = 1.0 + gamma * Math.max(q0, q1);
      }

      const qCurrent = predictQ(state)[action];
      const tdError = tdTarget - qCurrent;
      const w = weightsRef.current;
      for (let i = 0; i < 4; i++) {
        w[i][action] += alpha * tdError * state[i];
      }
      biasRef.current[action] += alpha * tdError;

      drawCart(newState);

      if (!done) {
        state = newState;
        action = nextAction;
        rafRef.current = requestAnimationFrame(frame);
      } else {
        setRewards((prev) => [...prev.slice(-199), { episode: ep, reward: totalReward }]);
        setEpisode(ep + 1);
      }
    }
    rafRef.current = requestAnimationFrame(frame);
  }

  useEffect(() => {
    if (!running) return;
    runEpisode(episode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, episode]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  function handleReset() {
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    weightsRef.current = [[0, 0], [0, 0], [0, 0], [0, 0]];
    biasRef.current = [0, 0];
    setEpisode(0);
    setRewards([]);
  }

  return (
    <div className="sandbox">
      <h4>Live demo — CartPole Q-learning with linear function approximation</h4>
      <Evidence
        kind="course"
        source="cart_pole_qlearning.py"
        note="Same physics, same linear Q(s,a) = weights·state + bias, same epsilon-greedy decay and TD-error gradient update as the course script — reimplemented in TypeScript so it runs in the browser instead of needing Python + Gymnasium installed."
      />
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", margin: "10px 0" }}>
        <label style={{ fontSize: 13 }}>
          α (learning rate): {alpha.toFixed(4)}
          <input type="range" min={0.0001} max={0.01} step={0.0001} value={alpha} onChange={(e) => setAlpha(+e.target.value)} disabled={running} />
        </label>
        <label style={{ fontSize: 13 }}>
          γ (discount): {gamma.toFixed(2)}
          <input type="range" min={0.5} max={0.999} step={0.01} value={gamma} onChange={(e) => setGamma(+e.target.value)} disabled={running} />
        </label>
        <label style={{ fontSize: 13 }}>
          decay rate: {decayRate.toFixed(3)}
          <input type="range" min={0.001} max={0.05} step={0.001} value={decayRate} onChange={(e) => setDecayRate(+e.target.value)} disabled={running} />
        </label>
      </div>
      <div className="run-controls">
        <button className={running ? "active" : ""} onClick={() => setRunning((r) => !r)}>
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={handleReset}>Reset</button>
        <span style={{ fontSize: 13, color: "var(--text-dim)" }}>Episode {episode}</span>
      </div>
      <canvas ref={canvasRef} width={600} height={160} style={{ width: "100%", background: "var(--code-bg)", borderRadius: 8 }} />
      {rewards.length > 1 && (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={rewards}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
            <XAxis dataKey="episode" stroke="#9aa3b2" fontSize={11} />
            <YAxis stroke="#9aa3b2" fontSize={11} domain={[0, 500]} />
            <Tooltip contentStyle={{ background: "#171a21", border: "1px solid #2a2f3a" }} />
            <Line type="monotone" dataKey="reward" stroke="#68d7a0" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
      <p style={{ fontSize: 12, color: "var(--text-dim)" }}>
        Reward per episode = timesteps survived (max 500). Watch the line trend upward over a few
        hundred episodes as the weights learn to balance the pole — confirms the linear Q-function
        update is working, not just the physics.
      </p>
    </div>
  );
}
