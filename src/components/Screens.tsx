import { useGameStore } from '../state/gameStore';

interface Props {
  onStart: () => void;
  cameraError: string | null;
  mediapipeError: string | null;
}

export function StartScreen({ onStart, cameraError, mediapipeError }: Props) {
  return (
    <div className="overlay start-screen">
      <div className="panel">
        <h1 className="title">Pose Runner</h1>
        <p className="subtitle">Endless runner controlled by your body</p>

        <ul className="instructions">
          <li>
            <strong>Pump your arms</strong> — run in place with your hands to move
          </li>
          <li>
            <strong>Jump</strong> — hop over low barriers
          </li>
          <li>
            <strong>Squat</strong> — duck under overhead barriers
          </li>
          <li>
            <strong>Lean left / right</strong> — switch lanes
          </li>
        </ul>

        <p className="hint">
          Keyboard: hold Shift to run · ← → lanes · Space jump · ↓ duck · ` debug
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
          Enable Camera &amp; Start
        </button>
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
        <h2>Calibration</h2>
        <p>Stand naturally in frame, arms relaxed</p>

        {error ? (
          <>
            <p className="error-msg">{error}</p>
            <button className="btn primary" onClick={onRetry}>
              Retry Calibration
            </button>
          </>
        ) : (
          <>
            <div className="countdown">{countdownSeconds > 0 ? countdownSeconds : 'Go!'}</div>
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
        <span className="label">Score</span>
        <span className="value">{Math.floor(score)}</span>
      </div>
      <div className="hud-coins">
        <span className="coin-icon">●</span>
        <span className="value">{coins}</span>
      </div>
      <div className="hud-gesture">
        <span className="label">Gesture</span>
        <span className="value gesture-value">{currentGesture}</span>
      </div>
      <div className="hud-run">
        <span className="label">{isRunning ? 'Running' : 'Pump arms to run'}</span>
        <span className={`value ${isRunning ? 'run-on' : 'run-off'}`}>
          {isRunning ? `${Math.round(runIntensity * 100)}%` : '—'}
        </span>
      </div>
      <div className="hud-speed">
        <span className="label">Speed</span>
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
        <h2>Game Over</h2>
        <div className="final-score">{Math.floor(score)}</div>
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
