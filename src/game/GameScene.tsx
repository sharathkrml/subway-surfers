import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { CONFIG } from '../config';
import { useGameStore } from '../state/gameStore';
import { Player } from './Player';
import { Track } from './Track';
import { Obstacles, Coins } from './Obstacles';
import {
  spawnObstacleWave,
  spawnCoinPattern,
  spawnIntervalForSpeed,
  type Obstacle,
  type Coin,
} from './spawner';
import { checkObstacleCollision, checkCoinCollisions } from './collision';

function GameWorld() {
  const status = useGameStore((s) => s.status);
  const laneIndex = useGameStore((s) => s.laneIndex);
  const playerAction = useGameStore((s) => s.playerAction);
  const addScore = useGameStore((s) => s.addScore);
  const addCoin = useGameStore((s) => s.addCoin);
  const endGame = useGameStore((s) => s.endGame);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const setDistance = useGameStore((s) => s.setDistance);
  const score = useGameStore((s) => s.score);

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);

  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const spawnTimer = useRef(0);
  const distanceRef = useRef(0);
  const scoreAcc = useRef(0);
  const endedRef = useRef(false);
  const playerX = useRef<number>(CONFIG.LANE_POSITIONS[1]);
  const jumpY = useRef(0);
  const jumpT = useRef(0);
  const prevAction = useRef(playerAction);

  // Reset world when entering playing
  useEffect(() => {
    if (status === 'playing') {
      obstaclesRef.current = [];
      coinsRef.current = [];
      setObstacles([]);
      setCoins([]);
      spawnTimer.current = 0.5;
      distanceRef.current = 0;
      scoreAcc.current = 0;
      endedRef.current = false;
      playerX.current = CONFIG.LANE_POSITIONS[1];
      jumpY.current = 0;
      jumpT.current = 0;
      prevAction.current = 'running';
    }
  }, [status]);

  useFrame((_, delta) => {
    if (status !== 'playing' || endedRef.current) return;

    const isRunning =
      useGameStore.getState().isRunning || useGameStore.getState().keyboardRunning;
    const runIntensity = useGameStore.getState().keyboardRunning
      ? Math.max(useGameStore.getState().runIntensity, CONFIG.RUN_KEYBOARD_INTENSITY)
      : useGameStore.getState().runIntensity;
    const targetSpeed = Math.min(
      CONFIG.MAX_SPEED,
      CONFIG.BASE_SPEED + score * CONFIG.SPEED_RAMP_PER_SCORE,
    );
    // World only scrolls while running gesture / keyboard hold is active
    const speed = isRunning ? targetSpeed * Math.max(0.25, runIntensity) : 0;
    setSpeed(speed);

    if (speed <= 0) {
      // Still allow lane lerp / jump / duck while idle standing
      const targetX = CONFIG.LANE_POSITIONS[laneIndex];
      const lerpSpeed = 1 - Math.pow(0.001, delta / (CONFIG.LANE_SWITCH_MS / 1000));
      playerX.current = THREE.MathUtils.lerp(playerX.current, targetX, lerpSpeed);

      const action = playerAction;
      if (action === 'jumping' && prevAction.current !== 'jumping') jumpT.current = 0;
      prevAction.current = action;
      if (action === 'jumping') {
        jumpT.current += delta;
        const t = Math.min(1, jumpT.current / (CONFIG.JUMP_DURATION_MS / 1000));
        jumpY.current = 4 * CONFIG.JUMP_HEIGHT * t * (1 - t);
      } else {
        jumpT.current = 0;
        jumpY.current = 0;
      }

      // Pre-spawn obstacles ahead while standing so the track isn't empty
      if (obstaclesRef.current.length === 0) {
        obstaclesRef.current = [
          ...spawnObstacleWave(CONFIG.SPAWN_Z),
          ...spawnObstacleWave(CONFIG.SPAWN_Z - 20),
        ];
        coinsRef.current = spawnCoinPattern(CONFIG.SPAWN_Z - 8);
        setObstacles([...obstaclesRef.current]);
        setCoins([...coinsRef.current]);
      }

      const halfH =
        action === 'ducking'
          ? (CONFIG.PLAYER_HEIGHT * CONFIG.DUCK_SCALE_Y) / 2
          : CONFIG.PLAYER_HALF_H;
      const playerY =
        action === 'ducking' ? halfH : CONFIG.PLAYER_HALF_H + jumpY.current;
      const bounds = {
        x: playerX.current,
        y: playerY,
        z: 0,
        halfW: CONFIG.PLAYER_HALF_W,
        halfH,
        halfD: CONFIG.PLAYER_HALF_D,
        action,
      };
      const hit = checkObstacleCollision(bounds, obstaclesRef.current);
      if (hit) {
        endedRef.current = true;
        endGame();
      }
      return;
    }

    distanceRef.current += speed * delta;
    setDistance(distanceRef.current);

    scoreAcc.current += CONFIG.SCORE_PER_SECOND * delta;
    if (scoreAcc.current >= 1) {
      const whole = Math.floor(scoreAcc.current);
      addScore(whole);
      scoreAcc.current -= whole;
    }

    // Track player X lerp (mirror Player.tsx)
    const targetX = CONFIG.LANE_POSITIONS[laneIndex];
    const lerpSpeed = 1 - Math.pow(0.001, delta / (CONFIG.LANE_SWITCH_MS / 1000));
    playerX.current = THREE.MathUtils.lerp(playerX.current, targetX, lerpSpeed);

    // Approximate jump height for collision (synced with Player.tsx)
    const action = playerAction;
    if (action === 'jumping' && prevAction.current !== 'jumping') {
      jumpT.current = 0;
    }
    prevAction.current = action;

    if (action === 'jumping') {
      jumpT.current += delta;
      const t = Math.min(1, jumpT.current / (CONFIG.JUMP_DURATION_MS / 1000));
      jumpY.current = 4 * CONFIG.JUMP_HEIGHT * t * (1 - t);
    } else {
      jumpT.current = 0;
      jumpY.current = 0;
    }

    const halfH =
      action === 'ducking'
        ? (CONFIG.PLAYER_HEIGHT * CONFIG.DUCK_SCALE_Y) / 2
        : CONFIG.PLAYER_HALF_H;
    const playerY =
      action === 'ducking'
        ? halfH
        : CONFIG.PLAYER_HALF_H + jumpY.current;

    // Move world toward camera (+z)
    obstaclesRef.current = obstaclesRef.current
      .map((o) => ({ ...o, z: o.z + speed * delta }))
      .filter((o) => o.z < CONFIG.DESPAWN_Z);

    coinsRef.current = coinsRef.current
      .map((c) => ({ ...c, z: c.z + speed * delta }))
      .filter((c) => c.z < CONFIG.DESPAWN_Z);

    // Spawn
    spawnTimer.current -= delta;
    if (spawnTimer.current <= 0) {
      const wave = spawnObstacleWave(CONFIG.SPAWN_Z);
      obstaclesRef.current = [...obstaclesRef.current, ...wave];
      if (Math.random() < CONFIG.COIN_SPAWN_CHANCE) {
        const newCoins = spawnCoinPattern(CONFIG.SPAWN_Z - 8);
        coinsRef.current = [...coinsRef.current, ...newCoins];
      }
      spawnTimer.current = spawnIntervalForSpeed(targetSpeed);
    }

    // Collision
    const bounds = {
      x: playerX.current,
      y: playerY,
      z: 0,
      halfW: CONFIG.PLAYER_HALF_W,
      halfH,
      halfD: CONFIG.PLAYER_HALF_D,
      action,
    };

    const hit = checkObstacleCollision(bounds, obstaclesRef.current);
    if (hit) {
      endedRef.current = true;
      endGame();
      return;
    }

    const collected = checkCoinCollisions(bounds, coinsRef.current);
    if (collected.length > 0) {
      const set = new Set(collected);
      coinsRef.current = coinsRef.current.map((c) =>
        set.has(c.id) ? { ...c, collected: true } : c,
      );
      collected.forEach(() => addCoin());
    }

    setObstacles([...obstaclesRef.current]);
    setCoins([...coinsRef.current]);
  });

  return (
    <>
      <Track />
      <Player />
      <Obstacles obstacles={obstacles} />
      <Coins coins={coins} />
    </>
  );
}

function Lights() {
  return (
    <>
      <Sky
        distance={450000}
        sunPosition={[5, 3, -20]}
        inclination={0.56}
        azimuth={0.22}
        turbidity={5}
        rayleigh={1.8}
      />
      <hemisphereLight args={['#c9efff', '#9b6245', 1.65]} />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[-8, 14, 6]}
        color="#fff0cf"
        intensity={2.6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={14}
        shadow-camera-bottom={-4}
      />
      <fog attach="fog" args={['#91d7e8', 40, 88]} />
    </>
  );
}

export function GameScene() {
  return (
    <Canvas
      shadows
      className="game-canvas"
      dpr={[1, 1.75]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.18;
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 4.1, 8.5]} fov={53} />
      <Lights />
      <GameWorld />
    </Canvas>
  );
}
