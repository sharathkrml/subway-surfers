import { useEffect, useRef } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { CONFIG } from '../config';

interface Props {
  video: HTMLVideoElement | null;
  landmarks: NormalizedLandmark[] | null;
  className?: string;
}

/** Mirrored PIP canvas drawing webcam feed + upper-body skeleton. */
export function WebcamPreview({ video, landmarks, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarksRef = useRef(landmarks);
  landmarksRef.current = landmarks;

  useEffect(() => {
    let raf = 0;

    const draw = () => {
      const canvas = canvasRef.current;
      const lm = landmarksRef.current;
      if (canvas && video && video.readyState >= 2) {
        const w = canvas.width;
        const h = canvas.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, w, h);

          if (lm) {
            const { LM } = CONFIG;
            const toXY = (p: NormalizedLandmark) => ({
              x: p.x * w,
              y: p.y * h,
            });

            ctx.strokeStyle = '#00e5ff';
            ctx.fillStyle = '#ff4081';
            ctx.lineWidth = 2;

            const nose = toXY(lm[LM.NOSE]);
            const ls = toXY(lm[LM.LEFT_SHOULDER]);
            const rs = toXY(lm[LM.RIGHT_SHOULDER]);
            const lh = toXY(lm[LM.LEFT_HIP]);
            const rh = toXY(lm[LM.RIGHT_HIP]);
            const lw = toXY(lm[LM.LEFT_WRIST]);
            const rw = toXY(lm[LM.RIGHT_WRIST]);
            const midShoulder = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
            const midHip = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };

            ctx.beginPath();
            ctx.moveTo(ls.x, ls.y);
            ctx.lineTo(rs.x, rs.y);
            ctx.moveTo(midShoulder.x, midShoulder.y);
            ctx.lineTo(midHip.x, midHip.y);
            ctx.moveTo(lh.x, lh.y);
            ctx.lineTo(rh.x, rh.y);
            ctx.moveTo(nose.x, nose.y);
            ctx.lineTo(midShoulder.x, midShoulder.y);
            // Arms / hands for run detection feedback
            ctx.moveTo(ls.x, ls.y);
            ctx.lineTo(lw.x, lw.y);
            ctx.moveTo(rs.x, rs.y);
            ctx.lineTo(rw.x, rw.y);
            ctx.stroke();

            for (const p of [nose, ls, rs, lh, rh, lw, rw]) {
              ctx.beginPath();
              ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          ctx.restore();
        }
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [video]);

  return (
    <div className={`webcam-preview ${className ?? ''}`}>
      <canvas ref={canvasRef} width={240} height={180} className="webcam-canvas" />
    </div>
  );
}
