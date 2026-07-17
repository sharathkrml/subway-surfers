# Pose Runner

Browser-based endless runner controlled by webcam body movement (Subway Surfers–style). Built with Vite, React, TypeScript, React Three Fiber, MediaPipe PoseLandmarker, and Zustand.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`), allow camera access, stand in frame for the 3-second calibration, then play.

## Controls

| Action | Body gesture | Keyboard fallback |
|--------|--------------|-------------------|
| **Run (move forward)** | Pump arms / hands as if running | Hold `Shift` |
| Jump | Jump in place | `Space` / `↑` / `W` |
| Duck | Squat and hold | `↓` / `S` (hold) |
| Lane left | Lean left | `←` / `A` |
| Lane right | Lean right | `→` / `D` |
| Debug panel | — | `` ` `` (backtick) |

The track **only scrolls while you are pumping your arms** (or holding Shift). Stop pumping and the world freezes.

## Project layout

- `src/vision/` — webcam, MediaPipe pose detection, gesture state machine
- `src/game/` — Three.js scene, player, obstacles, coins, collision, spawner
- `src/state/gameStore.ts` — Zustand game state + high score (localStorage)
- `src/components/` — Start / Calibration / HUD / Game Over / PIP / Debug
- `src/config.ts` — all tunable thresholds, speeds, and spawn rates

## Notes

- If MediaPipe fails to load (CDN blocked / unsupported browser), use keyboard controls.
- Play Again reuses the existing camera stream (no re-permission prompt).
- Gesture thresholds are normalized by torso height so distance from camera matters less; tweak them in `src/config.ts`.
