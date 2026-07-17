import { useEffect } from 'react';
import { useGameStore } from '../state/gameStore';

/** Keyboard: hold Shift to run, arrows lanes, Space jump, Down duck */
export function useKeyboardControls() {
  const status = useGameStore((s) => s.status);
  const applyGesture = useGameStore((s) => s.applyGesture);
  const setPlayerAction = useGameStore((s) => s.setPlayerAction);
  const setRunning = useGameStore((s) => s.setRunning);
  const setKeyboardRunning = useGameStore((s) => s.setKeyboardRunning);
  const toggleDebug = useGameStore((s) => s.toggleDebug);

  useEffect(() => {
    const down = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();

      if (e.code === 'Backquote') {
        toggleDebug();
        return;
      }

      if (status !== 'playing') return;

      if (e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setKeyboardRunning(true);
        applyGesture('run-start');
        return;
      }

      if (down.has(key)) return;
      down.add(key);

      if (key === 'arrowleft' || key === 'a') {
        applyGesture('lane-left');
      } else if (key === 'arrowright' || key === 'd') {
        applyGesture('lane-right');
      } else if (key === ' ' || key === 'arrowup' || key === 'w') {
        e.preventDefault();
        applyGesture('jump');
      } else if (key === 'arrowdown' || key === 's') {
        e.preventDefault();
        applyGesture('duck-start');
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      down.delete(key);
      if (status !== 'playing') return;

      if (e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setKeyboardRunning(false);
        applyGesture('run-end');
        return;
      }

      if (key === 'arrowdown' || key === 's') {
        applyGesture('duck-end');
        setPlayerAction('running');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [status, applyGesture, setPlayerAction, setRunning, setKeyboardRunning, toggleDebug]);
}
