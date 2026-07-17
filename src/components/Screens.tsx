import { useGameStore } from '../state/gameStore';

interface Props {
  onStart: () => void;
  cameraError: string | null;
  mediapipeError: string | null;
}

export function StartScreen({ onStart, cameraError, mediapipeError }: Props) {
  return (
    <div className="overlay start-screen">
      <div className="start-content">
        <div className="logo" aria-label="Rail Rush">
          <span className="logo-top">RAIL</span>
          <span className="logo-bottom">RUSH</span>
        </div>
        <p className="subtitle">Run the city. Own the rails.</p>

        <ul className="instructions" aria-label="Controls">
          <li>
            <span className="control-icon">🏃</span>
            <span><strong>Pump arms</strong><small>Run</small></span>
          </li>
          <li>
            <span className="control-icon">↑</span>
            <span><strong>Jump</strong><small>Hop</small></span>
          </li>
          <li>
            <span className="control-icon">↓</span>
            <span><strong>Squat</strong><small>Roll</small></span>
          </li>
          <li>
            <span className="control-icon">↔</span>
            <span><strong>Lean</strong><small>Dodge</small></span>
          </li>
        </ul>

        <p className="hint">
          Keyboard: hold Shift · arrows to dodge · Space to jump
        </p>

        {cameraError && <p className="error-msg">{cameraError}</p>}
        {mediapipeError && (
          <p className="error-msg">
            Pose detection unavailable — keyboard controls still work.
            <br />
            <small>{mediapipeError}</small>
          </p>
        )}

        <button className="btn primary" onClick={onStart}>
          <span>PLAY NOW</span>
          <span className="play-arrow">▶</span>
        </button>
        <div className="camera-note">Camera-powered motion controls</div>
      </div>
    </div>
  );
}

export function CalibrationOverlay({
  progress,
  error,
  onRetry,
  countdownSeconds,
}: {
  progress: number;
  error: string | null;
  onRetry: () => void;
  countdownSeconds: number;
}) {
  return (
    <div className="overlay calibration-overlay">
      <div className="panel">
        <div className="eyebrow">GET READY</div>
        <h2>Step into frame</h2>
        <p>Stand naturally with your arms relaxed</p>

        {error ? (
          <>
            <p className="error-msg">{error}</p>
            <button className="btn primary" onClick={onRetry}>
              Retry Calibration
            </button>
          </>
        ) : (
          <>
            <div className="countdown">{countdownSeconds > 0 ? countdownSeconds : 'GO!'}</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function HUD() {
  const score = useGameStore((s) => s.score);
  const coins = useGameStore((s) => s.coins);
  const currentGesture = useGameStore((s) => s.currentGesture);
  const speed = useGameStore((s) => s.speed);
  const isRunning = useGameStore((s) => s.isRunning || s.keyboardRunning);
  const runIntensity = useGameStore((s) =>
    s.keyboardRunning ? Math.max(s.runIntensity, 1) : s.runIntensity,
  );

  return (
    <div className="hud">
      <div className="hud-score">
        <span className="label">SCORE</span>
        <span className="value">{Math.floor(score)}</span>
      </div>
      <div className="hud-coins">
        <span className="coin-icon">★</span>
        <span className="value">{coins}</span>
      </div>
      <div className="hud-run">
        <span className="run-status">
          <i className={isRunning ? 'active' : ''} />
          {isRunning ? `RUNNING ${Math.round(runIntensity * 100)}%` : 'PUMP ARMS TO RUN'}
        </span>
        <span className="gesture-value">{currentGesture}</span>
      </div>
      <div className="hud-speed">
        <span className="speed-lines">≋</span>
        <span className="value">{speed.toFixed(0)}</span>
      </div>
    </div>
  );
}

export function GameOverScreen() {
  const score = useGameStore((s) => s.score);
  const coins = useGameStore((s) => s.coins);
  const highScore = useGameStore((s) => s.highScore);
  const playAgain = useGameStore((s) => s.playAgain);
  const resetToIdle = useGameStore((s) => s.resetToIdle);
  const isNewHigh = score >= highScore && score > 0;

  return (
    <div className="overlay gameover-screen">
      <div className="panel">
        <div className="eyebrow">RUN COMPLETE</div>
        <h2>Nice run!</h2>
        <div className="final-score">{Math.floor(score)}</div>
        <div className="score-caption">POINTS</div>
        <p className="coins-collected">{coins} coins collected</p>
        <p className="high-score">
          High Score: {Math.floor(highScore)}
          {isNewHigh && <span className="new-high"> New!</span>}
        </p>
        <div className="btn-row">
          <button className="btn primary" onClick={playAgain}>
            Play Again
          </button>
          <button className="btn secondary" onClick={resetToIdle}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
