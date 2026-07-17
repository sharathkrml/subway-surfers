import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../state/gameStore';

export interface WebcamState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  ready: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

export function useWebcam(): WebcamState {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setCameraError = useGameStore((s) => s.setCameraError);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setReady(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setCameraError(null);
    stop();

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = media;
      setStream(media);

      const video = videoRef.current;
      if (video) {
        video.srcObject = media;
        video.playsInline = true;
        video.muted = true;
        await video.play();
        setReady(true);
      }
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and try again.'
          : err instanceof Error
            ? err.message
            : 'Could not access webcam.';
      setError(msg);
      setCameraError(msg);
      setReady(false);
    }
  }, [stop, setCameraError]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { videoRef, stream, ready, error, start, stop };
}
