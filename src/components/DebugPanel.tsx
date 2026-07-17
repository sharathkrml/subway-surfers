import type { GestureDebug } from '../vision/useGestureDetector';

interface Props {
  debug: GestureDebug;
  visible: boolean;
}

export function DebugPanel({ debug, visible }: Props) {
  if (!visible) return null;

  const bl = debug.baseline;
  return (
    <div className="debug-panel">
      <div className="debug-title">Gesture Debug (press ` to toggle)</div>
      <div>state: {debug.gestureState}</div>
      <div>last: {debug.lastEvent}</div>
      <div>
        running: {debug.isRunning ? 'YES' : 'no'} · intensity {debug.runIntensity.toFixed(2)}
      </div>
      <div>
        runAmp: {debug.runAmp.toFixed(3)} · crossings: {debug.runCrossings}
      </div>
      <div>
        wrists Y: L {debug.leftWristY.toFixed(3)} / R {debug.rightWristY.toFixed(3)}
      </div>
      <div>
        midX: {debug.shoulderMidX.toFixed(3)}
        {bl ? ` (base ${bl.shoulderMidX.toFixed(3)}, Δ${(debug.shoulderMidX - bl.shoulderMidX).toFixed(3)})` : ''}
      </div>
      <div>
        midY: {debug.shoulderMidY.toFixed(3)}
        {bl ? ` (base ${bl.shoulderMidY.toFixed(3)}, Δ${(debug.shoulderMidY - bl.shoulderMidY).toFixed(3)})` : ''}
      </div>
      <div>
        torso: {debug.torsoHeight.toFixed(3)}
        {bl ? ` (base ${bl.torsoHeight.toFixed(3)})` : ''}
      </div>
      {debug.calibrating && (
        <div>calibrating… {(debug.calibrationProgress * 100).toFixed(0)}%</div>
      )}
    </div>
  );
}
