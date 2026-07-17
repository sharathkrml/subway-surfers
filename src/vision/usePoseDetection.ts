import { useEffect, useRef, useState } from 'react';
import {
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision';
import { CONFIG } from '../config';
import { useGameStore } from '../state/gameStore';

export interface PoseMetrics {
  shoulderMidX: number;
  shoulderMidY: number;
  hipMidY: number;
  torsoHeight: number;
  leftWristY: number;
  rightWristY: number;
  leftWristX: number;
  rightWristX: number;
  nose: NormalizedLandmark | null;
  leftShoulder: NormalizedLandmark | null;
  rightShoulder: NormalizedLandmark | null;
  leftHip: NormalizedLandmark | null;
  rightHip: NormalizedLandmark | null;
  leftWrist: NormalizedLandmark | null;
  rightWrist: NormalizedLandmark | null;
  detected: boolean;
  timestamp: number;
}

const EMPTY_METRICS: PoseMetrics = {
  shoulderMidX: 0.5,
  shoulderMidY: 0.5,
  hipMidY: 0.7,
  torsoHeight: 0.2,
  leftWristY: 0.6,
  rightWristY: 0.6,
  leftWristX: 0.4,
  rightWristX: 0.6,
  nose: null,
  leftShoulder: null,
  rightShoulder: null,
  leftHip: null,
  rightHip: null,
  leftWrist: null,
  rightWrist: null,
  detected: false,
  timestamp: 0,
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function usePoseDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
) {
  const [metrics, setMetrics] = useState<PoseMetrics>(EMPTY_METRICS);
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number>(0);
  const lastTsRef = useRef<number>(-1);
  const historyRef = useRef<
    {
      x: number;
      y: number;
      torso: number;
      hipY: number;
      lwY: number;
      rwY: number;
      lwX: number;
      rwX: number;
    }[]
  >([]);
  const setMediapipeError = useGameStore((s) => s.setMediapipeError);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(CONFIG.WASM_URL);
        if (cancelled) return;

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: CONFIG.POSE_MODEL_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });

        if (cancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setLoaded(true);
        setLoadError(null);
        setMediapipeError(null);
      } catch (err) {
        // Retry with CPU if GPU fails
        try {
          const vision = await FilesetResolver.forVisionTasks(CONFIG.WASM_URL);
          if (cancelled) return;
          const landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: CONFIG.POSE_MODEL_URL,
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numPoses: 1,
          });
          if (cancelled) {
            landmarker.close();
            return;
          }
          landmarkerRef.current = landmarker;
          setLoaded(true);
          setLoadError(null);
          setMediapipeError(null);
        } catch (err2) {
          const msg =
            err2 instanceof Error
              ? err2.message
              : 'Failed to load MediaPipe PoseLandmarker. Use keyboard controls instead.';
          setLoadError(msg);
          setMediapipeError(msg);
          setLoaded(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      setLoaded(false);
    };
  }, [enabled, setMediapipeError]);

  useEffect(() => {
    if (!enabled || !loaded) return;

    const loop = () => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (video && landmarker && video.readyState >= 2 && video.videoWidth > 0) {
        const ts = video.currentTime * 1000;
        if (ts !== lastTsRef.current && ts > 0) {
          lastTsRef.current = ts;
          try {
            const result = landmarker.detectForVideo(video, ts);
            const pose = result.landmarks?.[0];

            if (pose && pose.length > 0) {
              const { LM } = CONFIG;
              const ls = pose[LM.LEFT_SHOULDER];
              const rs = pose[LM.RIGHT_SHOULDER];
              const lh = pose[LM.LEFT_HIP];
              const rh = pose[LM.RIGHT_HIP];
              const lw = pose[LM.LEFT_WRIST];
              const rw = pose[LM.RIGHT_WRIST];
              const nose = pose[LM.NOSE];

              const shoulderMidX = (ls.x + rs.x) / 2;
              const shoulderMidY = (ls.y + rs.y) / 2;
              const hipMidY = (lh.y + rh.y) / 2;
              const torsoHeight = Math.max(Math.abs(hipMidY - shoulderMidY), 0.05);

              historyRef.current.push({
                x: shoulderMidX,
                y: shoulderMidY,
                torso: torsoHeight,
                hipY: hipMidY,
                lwY: lw.y,
                rwY: rw.y,
                lwX: lw.x,
                rwX: rw.x,
              });
              if (historyRef.current.length > CONFIG.SMOOTHING_FRAMES) {
                historyRef.current.shift();
              }

              const hist = historyRef.current;
              const smooth: PoseMetrics = {
                shoulderMidX: average(hist.map((h) => h.x)),
                shoulderMidY: average(hist.map((h) => h.y)),
                hipMidY: average(hist.map((h) => h.hipY)),
                torsoHeight: average(hist.map((h) => h.torso)),
                leftWristY: average(hist.map((h) => h.lwY)),
                rightWristY: average(hist.map((h) => h.rwY)),
                leftWristX: average(hist.map((h) => h.lwX)),
                rightWristX: average(hist.map((h) => h.rwX)),
                nose,
                leftShoulder: ls,
                rightShoulder: rs,
                leftHip: lh,
                rightHip: rh,
                leftWrist: lw,
                rightWrist: rw,
                detected: true,
                timestamp: performance.now(),
              };

              setMetrics(smooth);
              setLandmarks(pose);
            } else {
              setMetrics((prev) => ({ ...prev, detected: false, timestamp: performance.now() }));
              setLandmarks(null);
            }
          } catch {
            /* skip frame on transient errors */
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, loaded, videoRef]);

  return { metrics, landmarks, loaded, loadError };
}
