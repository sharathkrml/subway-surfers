import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGameStore } from './state/gameStore';
import { useWebcam } from './vision/useWebcam';
import { usePoseDetection } from './vision/usePoseDetection';
import { useGestureDetector } from './vision/useGestureDetector';
import { GameScene } from './game/GameScene';
import { useKeyboardControls } from './game/useKeyboardControls';
import { WebcamPreview } from './components/WebcamPreview';
import { DebugPanel } from './components/DebugPanel';
import {
  StartScreen,
  CalibrationOverlay,
  HUD,
  GameOverScreen,
} from './components/Screens';
import { CONFIG, type GestureEvent } from './config';
import './index.css';

export default function App() {
  const status = useGameStore((s) => s.status);
  const cameraError = useGameStore((s) => s.cameraError);
  const mediapipeError = useGameStore((s) => s.mediapipeError);
  const debugVisible = useGameStore((s) => s.debugVisible);
  const startCalibration = useGameStore((s) => s.startCalibration);
  const startGame = useGameStore((s) => s.startGame);
  const applyGesture = useGameStore((s) => s.applyGesture);
  const setRunning = useGameStore((s) => s.setRunning);

  const webcam = useWebcam();
  const visionEnabled = status !== 'idle' && webcam.ready;
  const { metrics, landmarks, loaded: poseLoaded, loadError } = usePoseDetection(
    webcam.videoRef,
    visionEnabled,
  );

  const [calibrateRequest, setCalibrateRequest] = useState(0);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  const onGesture = useCallback(
    (event: GestureEvent) => {
      // run-start/run-end intensity is handled via onRunningChange; still update gesture label
      applyGesture(event);
    },
    [applyGesture],
  );

  const onRunningChange = useCallback(
    (isRunning: boolean, intensity: number) => {
      if (useGameStore.getState().status !== 'playing') return;
      setRunning(isRunning, intensity);
    },
    [setRunning],
  );

  const gestureActive =
    (status === 'calibrating' || status === 'playing') && (poseLoaded || !!loadError);

  const { debug, calibrationDone, calibrationError } = useGestureDetector(
    metrics,
    gestureActive && poseLoaded,
    onGesture,
    calibrateRequest,
    onRunningChange,
  );

  useKeyboardControls();

  // Bind video element state for PIP canvas
  useEffect(() => {
    setVideoEl(webcam.videoRef.current);
  }, [webcam.ready, webcam.videoRef]);

  // When calibration completes successfully, start the game
  useEffect(() => {
    if (status === 'calibrating' && calibrationDone) {
      startGame();
    }
  }, [status, calibrationDone, startGame]);

  // Kick off calibration when camera + pose ready
  useEffect(() => {
    if (status === 'calibrating' && webcam.ready && poseLoaded) {
      setCalibrateRequest((n) => n + 1);
    }
  }, [status, webcam.ready, poseLoaded]);

  // If MediaPipe failed, skip calibration and play with keyboard
  useEffect(() => {
    if (status !== 'calibrating') return;
    if (!loadError && !mediapipeError) return;
    if (!webcam.ready && webcam.error) return; // wait for camera retry UI

    const t = window.setTimeout(() => startGame(), 1200);
    return () => clearTimeout(t);
  }, [status, loadError, mediapipeError, startGame, webcam.ready, webcam.error]);

  const handleStart = async () => {
    // Keep video mounted (always rendered below) — start camera first, then calibrate
    if (!webcam.ready) {
      await webcam.start();
    }
    // Even if camera fails, allow keyboard-only via calibration screen retry options
    startCalibration();
  };

  const handleRetryCalibration = () => {
    setCalibrateRequest((n) => n + 1);
  };

  const handleRetryCamera = async () => {
    await webcam.start();
  };

  const countdownSeconds = useMemo(() => {
    if (!debug.calibrating) return Math.ceil(CONFIG.CALIBRATION_MS / 1000);
    return Math.max(
      0,
      Math.ceil((1 - debug.calibrationProgress) * (CONFIG.CALIBRATION_MS / 1000)),
    );
  }, [debug.calibrating, debug.calibrationProgress]);

  const showGame =
    status === 'playing' || status === 'gameover' || status === 'calibrating';
  const showPip = status !== 'idle' && webcam.ready;

  return (
    <div className="app">
      {/* Always-mounted video so getUserMedia can attach before leaving idle */}
      <video
        ref={webcam.videoRef}
        playsInline
        muted
        className="webcam-video-hidden"
      />

      {showGame && <GameScene />}

      {status === 'idle' && (
        <StartScreen
          onStart={handleStart}
          cameraError={cameraError ?? webcam.error}
          mediapipeError={mediapipeError ?? loadError}
        />
      )}

      {status === 'calibrating' && (
        <>
          {webcam.error && !webcam.ready ? (
            <div className="overlay">
              <div className="panel">
                <h2>Camera Needed</h2>
                <p className="error-msg">{webcam.error}</p>
                <button className="btn primary" onClick={handleRetryCamera}>
                  Retry Camera
                </button>
                <button
                  className="btn secondary"
                  onClick={() => startGame()}
                  style={{ marginTop: 12 }}
                >
                  Play with Keyboard Only
                </button>
              </div>
            </div>
          ) : (
            <CalibrationOverlay
              progress={debug.calibrating ? debug.calibrationProgress : 0}
              error={calibrationError}
              onRetry={handleRetryCalibration}
              countdownSeconds={countdownSeconds}
            />
          )}
        </>
      )}

      {status === 'playing' && <HUD />}

      {status === 'gameover' && <GameOverScreen />}

      {showPip && (
        <WebcamPreview video={videoEl} landmarks={landmarks} className="pip" />
      )}

      <DebugPanel debug={debug} visible={debugVisible} />
    </div>
  );
}
