import { useCallback, useEffect, useRef, useState } from 'react';
import { CONFIG, type GestureEvent } from '../config';
import type { PoseMetrics } from './usePoseDetection';

export interface CalibrationBaseline {
  shoulderMidX: number;
  shoulderMidY: number;
  torsoHeight: number;
}

export interface GestureDebug {
  shoulderMidX: number;
  shoulderMidY: number;
  torsoHeight: number;
  leftWristY: number;
  rightWristY: number;
  runIntensity: number;
  runCrossings: number;
  runAmp: number;
  isRunning: boolean;
  baseline: CalibrationBaseline | null;
  gestureState: string;
  lastEvent: GestureEvent | 'none';
  calibrating: boolean;
  calibrationProgress: number;
  calibrationError: string | null;
}

interface JumpSample {
  y: number;
  t: number;
}

interface WristSample {
  t: number;
  leftY: number;
  rightY: number;
  diff: number;
}

export function useGestureDetector(
  metrics: PoseMetrics,
  active: boolean,
  onEvent: (event: GestureEvent) => void,
  calibrateRequest: number,
  onRunningChange?: (isRunning: boolean, intensity: number) => void,
) {
  const [baseline, setBaseline] = useState<CalibrationBaseline | null>(null);
  const [debug, setDebug] = useState<GestureDebug>({
    shoulderMidX: 0.5,
    shoulderMidY: 0.5,
    torsoHeight: 0.2,
    leftWristY: 0.6,
    rightWristY: 0.6,
    runIntensity: 0,
    runCrossings: 0,
    runAmp: 0,
    isRunning: false,
    baseline: null,
    gestureState: 'idle',
    lastEvent: 'none',
    calibrating: false,
    calibrationProgress: 0,
    calibrationError: null,
  });
  const [calibrationDone, setCalibrationDone] = useState(false);
  const [calibrationError, setCalibrationError] = useState<string | null>(null);

  const baselineRef = useRef<CalibrationBaseline | null>(null);
  const jumpHistoryRef = useRef<JumpSample[]>([]);
  const jumpCooldownUntilRef = useRef(0);
  const duckHoldStartRef = useRef<number | null>(null);
  const isDuckingRef = useRef(false);
  const laneCooldownUntilRef = useRef(0);
  const laneArmedRef = useRef({ left: true, right: true });
  const lastEventRef = useRef<GestureEvent | 'none'>('none');
  const gestureStateRef = useRef('idle');

  const wristHistoryRef = useRef<WristSample[]>([]);
  const isRunningRef = useRef(false);
  const lastPumpAtRef = useRef(0);
  const runIntensityRef = useRef(0);

  const calibSamplesRef = useRef<CalibrationBaseline[]>([]);
  const calibStartRef = useRef(0);
  const calibPoseSeenRef = useRef(false);
  const calibratingRef = useRef(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const onRunningChangeRef = useRef(onRunningChange);
  onRunningChangeRef.current = onRunningChange;

  const emit = useCallback((event: GestureEvent) => {
    lastEventRef.current = event;
    onEventRef.current(event);
  }, []);

  const setRunning = useCallback((running: boolean, intensity: number) => {
    const was = isRunningRef.current;
    isRunningRef.current = running;
    runIntensityRef.current = intensity;
    onRunningChangeRef.current?.(running, intensity);
    if (running && !was) emit('run-start');
    if (!running && was) emit('run-end');
  }, [emit]);

  useEffect(() => {
    if (calibrateRequest <= 0) return;
    calibratingRef.current = true;
    calibSamplesRef.current = [];
    calibStartRef.current = performance.now();
    calibPoseSeenRef.current = false;
    setCalibrationDone(false);
    setCalibrationError(null);
    setBaseline(null);
    baselineRef.current = null;
    isDuckingRef.current = false;
    duckHoldStartRef.current = null;
    laneArmedRef.current = { left: true, right: true };
    wristHistoryRef.current = [];
    setRunning(false, 0);
    gestureStateRef.current = 'calibrating';
  }, [calibrateRequest, setRunning]);

  useEffect(() => {
    if (!active) return;

    const now = performance.now();

    if (calibratingRef.current) {
      const elapsed = now - calibStartRef.current;
      const progress = Math.min(1, elapsed / CONFIG.CALIBRATION_MS);

      if (metrics.detected) {
        calibPoseSeenRef.current = true;
        calibSamplesRef.current.push({
          shoulderMidX: metrics.shoulderMidX,
          shoulderMidY: metrics.shoulderMidY,
          torsoHeight: metrics.torsoHeight,
        });
      }

      setDebug({
        shoulderMidX: metrics.shoulderMidX,
        shoulderMidY: metrics.shoulderMidY,
        torsoHeight: metrics.torsoHeight,
        leftWristY: metrics.leftWristY,
        rightWristY: metrics.rightWristY,
        runIntensity: 0,
        runCrossings: 0,
        runAmp: 0,
        isRunning: false,
        baseline: null,
        gestureState: 'calibrating',
        lastEvent: 'none',
        calibrating: true,
        calibrationProgress: progress,
        calibrationError: null,
      });

      if (elapsed >= CONFIG.CALIBRATION_MS) {
        calibratingRef.current = false;
        if (!calibPoseSeenRef.current || calibSamplesRef.current.length < 10) {
          const err = 'No pose detected. Stand in frame and try again.';
          setCalibrationError(err);
          setCalibrationDone(false);
          setDebug((d) => ({ ...d, calibrating: false, calibrationError: err, gestureState: 'error' }));
        } else {
          const samples = calibSamplesRef.current;
          const avg = {
            shoulderMidX: samples.reduce((s, x) => s + x.shoulderMidX, 0) / samples.length,
            shoulderMidY: samples.reduce((s, x) => s + x.shoulderMidY, 0) / samples.length,
            torsoHeight: samples.reduce((s, x) => s + x.torsoHeight, 0) / samples.length,
          };
          baselineRef.current = avg;
          setBaseline(avg);
          setCalibrationDone(true);
          setCalibrationError(null);
          gestureStateRef.current = 'ready';
        }
      }
      return;
    }

    const bl = baselineRef.current;
    if (!bl || !metrics.detected) {
      if (isRunningRef.current) setRunning(false, 0);
      setDebug({
        shoulderMidX: metrics.shoulderMidX,
        shoulderMidY: metrics.shoulderMidY,
        torsoHeight: metrics.torsoHeight,
        leftWristY: metrics.leftWristY,
        rightWristY: metrics.rightWristY,
        runIntensity: 0,
        runCrossings: 0,
        runAmp: 0,
        isRunning: false,
        baseline: bl,
        gestureState: gestureStateRef.current,
        lastEvent: lastEventRef.current,
        calibrating: false,
        calibrationProgress: 1,
        calibrationError: null,
      });
      return;
    }

    const torso = Math.max(metrics.torsoHeight, 0.05);
    const dx = metrics.shoulderMidX - bl.shoulderMidX;

    // --- RUN: alternating arm/hand pumps (wrist Y difference oscillates) ---
    const wristDiff = metrics.leftWristY - metrics.rightWristY;
    wristHistoryRef.current.push({
      t: now,
      leftY: metrics.leftWristY,
      rightY: metrics.rightWristY,
      diff: wristDiff,
    });
    wristHistoryRef.current = wristHistoryRef.current.filter(
      (s) => now - s.t <= CONFIG.RUN_WINDOW_MS,
    );

    const hist = wristHistoryRef.current;
    let runAmp = 0;
    let crossings = 0;
    let intensity = 0;
    let pumping = false;

    if (hist.length >= 6) {
      const diffs = hist.map((s) => s.diff);
      const minD = Math.min(...diffs);
      const maxD = Math.max(...diffs);
      runAmp = (maxD - minD) / torso;
      const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;

      for (let i = 1; i < diffs.length; i++) {
        const a = diffs[i - 1] - mean;
        const b = diffs[i] - mean;
        if ((a <= 0 && b > 0) || (a >= 0 && b < 0)) crossings += 1;
      }

      pumping =
        runAmp >= CONFIG.RUN_AMP_THRESHOLD && crossings >= CONFIG.RUN_MIN_CROSSINGS;

      if (pumping) {
        lastPumpAtRef.current = now;
        // Intensity from amplitude + cadence
        const ampFactor = Math.min(1, (runAmp - CONFIG.RUN_AMP_THRESHOLD) / 0.25);
        const cadenceFactor = Math.min(1, (crossings - CONFIG.RUN_MIN_CROSSINGS) / 4);
        intensity = Math.max(0.35, 0.4 * ampFactor + 0.6 * cadenceFactor + 0.2);
      }
    }

    const stillCoasting = now - lastPumpAtRef.current < CONFIG.RUN_DECAY_MS;
    const isRunning = pumping || (isRunningRef.current && stillCoasting);
    if (!pumping && stillCoasting) {
      intensity = Math.max(0.2, runIntensityRef.current * 0.85);
    }
    if (!isRunning) intensity = 0;

    setRunning(isRunning, intensity);
    if (isRunning && gestureStateRef.current !== 'jump' && !isDuckingRef.current) {
      gestureStateRef.current = 'running';
    } else if (!isRunning && gestureStateRef.current === 'running') {
      gestureStateRef.current = 'idle';
    }

    // --- JUMP ---
    jumpHistoryRef.current.push({ y: metrics.shoulderMidY, t: now });
    jumpHistoryRef.current = jumpHistoryRef.current.filter(
      (s) => now - s.t <= CONFIG.JUMP_WINDOW_MS,
    );

    const jumpThresholdY = bl.shoulderMidY - CONFIG.JUMP_THRESHOLD * torso;
    const recentMinY = Math.min(...jumpHistoryRef.current.map((s) => s.y));
    const recentMaxY = Math.max(...jumpHistoryRef.current.map((s) => s.y));
    const upwardSpike =
      recentMinY < jumpThresholdY && recentMaxY - recentMinY > CONFIG.JUMP_THRESHOLD * torso * 0.5;

    if (upwardSpike && now > jumpCooldownUntilRef.current && !isDuckingRef.current) {
      jumpCooldownUntilRef.current = now + CONFIG.JUMP_COOLDOWN_MS;
      duckHoldStartRef.current = null;
      gestureStateRef.current = 'jump';
      emit('jump');
    }

    // --- DUCK ---
    const duckThresholdY = bl.shoulderMidY + CONFIG.DUCK_THRESHOLD * torso;
    if (metrics.shoulderMidY > duckThresholdY) {
      if (duckHoldStartRef.current === null) {
        duckHoldStartRef.current = now;
      } else if (
        now - duckHoldStartRef.current >= CONFIG.DUCK_HOLD_MS &&
        !isDuckingRef.current &&
        now > jumpCooldownUntilRef.current
      ) {
        isDuckingRef.current = true;
        gestureStateRef.current = 'ducking';
        emit('duck-start');
      }
    } else {
      duckHoldStartRef.current = null;
      if (isDuckingRef.current) {
        const nearBaseline =
          Math.abs(metrics.shoulderMidY - bl.shoulderMidY) < CONFIG.DUCK_END_TOLERANCE * torso ||
          metrics.shoulderMidY < bl.shoulderMidY + CONFIG.DUCK_END_TOLERANCE * torso;
        if (nearBaseline || metrics.shoulderMidY < duckThresholdY) {
          isDuckingRef.current = false;
          gestureStateRef.current = isRunningRef.current ? 'running' : 'idle';
          emit('duck-end');
        }
      }
    }

    // --- LANE CHANGE ---
    const laneDelta = CONFIG.LANE_THRESHOLD * torso;
    const returnDelta = laneDelta * CONFIG.LANE_RETURN_RATIO;

    if (Math.abs(dx) < returnDelta) {
      laneArmedRef.current = { left: true, right: true };
      if (!isDuckingRef.current && gestureStateRef.current !== 'jump') {
        if (!isRunningRef.current) gestureStateRef.current = 'center';
      }
    }

    if (now > laneCooldownUntilRef.current && !isDuckingRef.current) {
      if (dx > laneDelta && laneArmedRef.current.left) {
        laneArmedRef.current.left = false;
        laneCooldownUntilRef.current = now + CONFIG.LANE_COOLDOWN_MS;
        gestureStateRef.current = 'lane-left';
        emit('lane-left');
      } else if (dx < -laneDelta && laneArmedRef.current.right) {
        laneArmedRef.current.right = false;
        laneCooldownUntilRef.current = now + CONFIG.LANE_COOLDOWN_MS;
        gestureStateRef.current = 'lane-right';
        emit('lane-right');
      }
    }

    setDebug({
      shoulderMidX: metrics.shoulderMidX,
      shoulderMidY: metrics.shoulderMidY,
      torsoHeight: metrics.torsoHeight,
      leftWristY: metrics.leftWristY,
      rightWristY: metrics.rightWristY,
      runIntensity: intensity,
      runCrossings: crossings,
      runAmp,
      isRunning,
      baseline: bl,
      gestureState: gestureStateRef.current,
      lastEvent: lastEventRef.current,
      calibrating: false,
      calibrationProgress: 1,
      calibrationError: null,
    });
  }, [metrics, active, emit, setRunning]);

  return {
    baseline,
    debug,
    calibrationDone,
    calibrationError,
    isCalibrating: calibratingRef.current,
  };
}
