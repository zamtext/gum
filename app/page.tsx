'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameState,
  PlayerInput,
  ShipClassType,
} from '../lib/game/types';
import {
  GameEngine,
  SoundEvents,
  createInitialGameState,
  createNewPlayer,
  createAsteroid,
} from '../lib/game/engine';
import { soundManager } from '../lib/game/audio';
import { P2PNetworkManager } from '../lib/network/p2p';
import GameCanvas from '../components/GameCanvas';
import HUD from '../components/HUD';
import LobbyModal from '../components/LobbyModal';
import GameOverModal from '../components/GameOverModal';
import GitHubExportGuide from '../components/GitHubExportGuide';
import MobileControls from '../components/MobileControls';

export default function SpaceCombatPage() {
  const [inGame, setInGame] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [localPlayerId, setLocalPlayerId] = useState('');
  const [ping, setPing] = useState(24);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showExportGuide, setShowExportGuide] = useState(false);

  // Initial dummy state for rendering
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState('LOBBY', 'local')
  );

  // Engine & Network References
  const engineRef = useRef<GameEngine | null>(null);
  const networkRef = useRef<P2PNetworkManager | null>(null);
  const playerInputsRef = useRef<Record<string, PlayerInput>>({});
  const localInputRef = useRef<PlayerInput>({
    thrust: false,
    reverse: false,
    turnLeft: false,
    turnRight: false,
    fire: false,
    shield: false,
    boost: false,
  });

  const lastLoopTimeRef = useRef<number>(0);
  const loopAnimRef = useRef<number | null>(null);
  const broadcastIntervalRef = useRef<any>(null);

  // Read URL query parameter for room code if invite link clicked
  const [urlRoomCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('room');
      return code ? code.toUpperCase() : '';
    }
    return '';
  });

  // Sound handler for engine events
  const handleEngineSound = useCallback((event: SoundEvents) => {
    if (event.laser) soundManager.playLaser(event.laser);
    if (event.explosion) soundManager.playExplosion(event.explosion);
    if (event.hit) soundManager.playHit();
    if (event.shield) soundManager.playShieldDeflect();
    if (event.powerUp) soundManager.playPowerUp();
    if (event.victory) soundManager.playVictory();
  }, []);

  // Host a new Room
  const handleHostRoom = async (
    code: string,
    name: string,
    color: string,
    shipClass: ShipClassType
  ) => {
    setIsConnecting(true);
    setStatusMessage('Booting WebRTC host server...');

    const net = new P2PNetworkManager({
      onStateUpdate: (state) => {
        setGameState(state);
      },
      onPlayerInput: (playerId, input) => {
        playerInputsRef.current[playerId] = input;
      },
      onPlayerJoin: (playerId, info) => {
        if (engineRef.current) {
          const newP = createNewPlayer(
            playerId,
            info.name,
            info.color,
            info.shipClass,
            false
          );
          engineRef.current.state.players[playerId] = newP;
        }
      },
      onPlayerLeave: (playerId) => {
        if (engineRef.current) {
          delete engineRef.current.state.players[playerId];
        }
      },
      onStatusChange: (status, msg) => {
        if (msg) setStatusMessage(msg);
        if (status === 'connected') {
          setIsConnecting(false);
        } else if (status === 'error') {
          setIsConnecting(false);
        }
      },
      onRoomCodeAssigned: (newCode) => {
        setRoomCode(newCode);
        if (engineRef.current) {
          engineRef.current.state.roomId = newCode;
        }
      },
      onPingUpdate: (p) => setPing(p),
    });

    networkRef.current = net;
    const hostId = net.myId;
    setLocalPlayerId(hostId);
    setRoomCode(code);
    setIsHost(true);

    // Create Initial Game State and local player
    const initialState = createInitialGameState(code, hostId);
    const hostPlayer = createNewPlayer(hostId, name, color, shipClass, false);
    initialState.players[hostId] = hostPlayer;

    const engine = new GameEngine(initialState, handleEngineSound);
    engineRef.current = engine;
    setGameState({ ...initialState });

    await net.initHost(code, { name, color, shipClass });

    setInGame(true);
    setIsConnecting(false);
  };

  // Join an existing Room
  const handleJoinRoom = async (
    code: string,
    name: string,
    color: string,
    shipClass: ShipClassType
  ) => {
    setIsConnecting(true);
    setStatusMessage(`Connecting to room ${code}...`);

    const net = new P2PNetworkManager({
      onStateUpdate: (state) => {
        setGameState(state);
      },
      onStatusChange: (status, msg) => {
        if (msg) setStatusMessage(msg);
        if (status === 'connected') {
          setIsConnecting(false);
          setInGame(true);
        } else if (status === 'error') {
          setIsConnecting(false);
        }
      },
      onPingUpdate: (p) => setPing(p),
    });

    networkRef.current = net;
    setLocalPlayerId(net.myId);
    setRoomCode(code);
    setIsHost(false);

    await net.joinRoom(code, { name, color, shipClass });
  };

  // Quick Solo Practice with AI Opponent
  const handleSoloPractice = (
    name: string,
    color: string,
    shipClass: ShipClassType
  ) => {
    const code = 'SOLO';
    setIsHost(true);
    setRoomCode(code);

    const net = new P2PNetworkManager({
      onStateUpdate: (state) => setGameState(state),
      onPlayerInput: (playerId, input) => {
        playerInputsRef.current[playerId] = input;
      },
      onStatusChange: () => {},
    });
    networkRef.current = net;
    const hostId = net.myId;
    setLocalPlayerId(hostId);

    const initialState = createInitialGameState(code, hostId);
    const hostPlayer = createNewPlayer(hostId, name, color, shipClass, false);
    initialState.players[hostId] = hostPlayer;

    // Add immediate AI Combat Drone
    const botId = `bot_${Math.random().toString(36).substring(2, 6)}`;
    const botPlayer = createNewPlayer(
      botId,
      'Nexus-Drone',
      '#ff2a5f',
      'wraith',
      true
    );
    initialState.players[botId] = botPlayer;

    const engine = new GameEngine(initialState, handleEngineSound);
    engineRef.current = engine;
    setGameState({ ...initialState });

    setInGame(true);
  };

  // Host Add AI Bot
  const handleAddBot = () => {
    if (!isHost || !engineRef.current) return;
    const botNames = ['Apex-Drone', 'Viper-X', 'Phantom-07', 'Titan-Unit', 'Aero-9'];
    const botColors = ['#ff2a5f', '#ffaa00', '#b026ff', '#00ff88'];
    const botClasses: ShipClassType[] = ['interceptor', 'vanguard', 'wraith'];

    const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const randomName = botNames[Math.floor(Math.random() * botNames.length)];
    const randomColor = botColors[Math.floor(Math.random() * botColors.length)];
    const randomClass = botClasses[Math.floor(Math.random() * botClasses.length)];

    const botPlayer = createNewPlayer(botId, randomName, randomColor, randomClass, true);
    engineRef.current.state.players[botId] = botPlayer;
  };

  // Host Remove AI Bot
  const handleRemoveBot = () => {
    if (!isHost || !engineRef.current) return;
    const botId = Object.keys(engineRef.current.state.players).find(
      (id) => engineRef.current?.state.players[id].isBot
    );
    if (botId) {
      delete engineRef.current.state.players[botId];
    }
  };

  // Host Rematch Trigger
  const handleRematch = () => {
    if (!isHost || !engineRef.current) return;
    const currentPlayers = engineRef.current.state.players;

    // Reset player scores and health
    for (const id in currentPlayers) {
      const p = currentPlayers[id];
      p.health = p.maxHealth;
      p.shield = p.maxShield;
      p.kills = 0;
      p.deaths = 0;
      p.score = 0;
      p.isAlive = true;
      p.invulnerableTimer = 2.5;
      p.activePowerUp = undefined;
    }

    engineRef.current.state.gameStatus = 'playing';
    engineRef.current.state.winner = undefined;
    engineRef.current.state.matchTime = 0;
    engineRef.current.state.killFeed = [];
    engineRef.current.state.projectiles = [];
    engineRef.current.state.particles = [];
  };

  // Return to Lobby / Disconnect
  const handleReturnToLobby = () => {
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }
    engineRef.current = null;
    setInGame(false);
    setIsHost(false);
    setStatusMessage('');
  };

  // Host Simulation Tick Loop (60 FPS)
  useEffect(() => {
    if (!inGame || !isHost) return;

    let animId: number;
    lastLoopTimeRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastLoopTimeRef.current) / 1000);
      lastLoopTimeRef.current = now;

      if (engineRef.current) {
        // Feed local host inputs
        playerInputsRef.current[localPlayerId] = { ...localInputRef.current };

        // Engine simulation step
        engineRef.current.update(dt, playerInputsRef.current);

        // Update local React state for rendering
        setGameState({ ...engineRef.current.state });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    loopAnimRef.current = animId;

    // Broadcast state snapshots to connected peers at 30Hz
    broadcastIntervalRef.current = setInterval(() => {
      if (engineRef.current && networkRef.current) {
        networkRef.current.broadcastState(engineRef.current.state);
      }
    }, 1000 / 30);

    return () => {
      cancelAnimationFrame(animId);
      if (broadcastIntervalRef.current) clearInterval(broadcastIntervalRef.current);
    };
  }, [inGame, isHost, localPlayerId]);

  // Client Input Transmit Loop (runs when client)
  useEffect(() => {
    if (!inGame || isHost) return;

    const inputSendInterval = setInterval(() => {
      if (networkRef.current) {
        networkRef.current.sendInput({ ...localInputRef.current });
      }
    }, 1000 / 45); // 45Hz input transmission

    return () => clearInterval(inputSendInterval);
  }, [inGame, isHost]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!inGame) return;
      // Prevent browser default scroll
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          localInputRef.current.thrust = true;
          soundManager.setThruster(true, localInputRef.current.boost);
          break;
        case 'KeyS':
        case 'ArrowDown':
          localInputRef.current.reverse = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          localInputRef.current.turnLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          localInputRef.current.turnRight = true;
          break;
        case 'Space':
          localInputRef.current.fire = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          localInputRef.current.shield = true;
          break;
        case 'KeyQ':
        case 'KeyE':
          localInputRef.current.boost = true;
          if (localInputRef.current.thrust) {
            soundManager.setThruster(true, true);
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!inGame) return;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          localInputRef.current.thrust = false;
          soundManager.setThruster(false);
          break;
        case 'KeyS':
        case 'ArrowDown':
          localInputRef.current.reverse = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          localInputRef.current.turnLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          localInputRef.current.turnRight = false;
          break;
        case 'Space':
          localInputRef.current.fire = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          localInputRef.current.shield = false;
          break;
        case 'KeyQ':
        case 'KeyE':
          localInputRef.current.boost = false;
          if (localInputRef.current.thrust) {
            soundManager.setThruster(true, false);
          }
          break;
      }
    };

    const handleBlur = () => {
      // Reset inputs on blur
      localInputRef.current = {
        thrust: false,
        reverse: false,
        turnLeft: false,
        turnRight: false,
        fire: false,
        shield: false,
        boost: false,
      };
      soundManager.setThruster(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [inGame]);

  // Pointer movement aiming
  const handlePointerAngle = useCallback((angle: number) => {
    localInputRef.current.mouseAngle = angle;
  }, []);

  // Pointer click fire
  const handleFireRequest = useCallback((active: boolean) => {
    localInputRef.current.fire = active;
  }, []);

  // Mobile virtual controls input state updater
  const handleMobileInput = useCallback((key: string, value: boolean) => {
    (localInputRef.current as any)[key] = value;
    if (key === 'thrust') {
      soundManager.setThruster(value, localInputRef.current.boost);
    }
  }, []);

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0a0a0c] text-slate-200 font-sans select-none">
      {/* Subtle Dot Matrix Ambient Overlay from Artistic Flair */}
      <div className="pointer-events-none absolute inset-0 bg-dot-matrix opacity-15 z-0" />

      {/* 1. Main 60 FPS Game Canvas */}
      <GameCanvas
        gameState={gameState}
        localPlayerId={localPlayerId}
        onPointerMove={handlePointerAngle}
        onFireRequest={handleFireRequest}
      />

      {/* 2. Heads-Up Display Overlay (Active during match) */}
      {inGame && (
        <>
          <HUD
            gameState={gameState}
            localPlayerId={localPlayerId}
            roomCode={roomCode}
            isHost={isHost}
            ping={ping}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onAddBot={handleAddBot}
            onRemoveBot={handleRemoveBot}
            onOpenExportGuide={() => setShowExportGuide(true)}
            onLeaveRoom={handleReturnToLobby}
          />
          <MobileControls onInputStateChange={handleMobileInput} />
        </>
      )}

      {/* 3. Lobby Modal (When joining or hosting) */}
      {!inGame && (
        <LobbyModal
          onHostRoom={handleHostRoom}
          onJoinRoom={handleJoinRoom}
          onSoloPractice={handleSoloPractice}
          onOpenExportGuide={() => setShowExportGuide(true)}
          initialRoomCode={urlRoomCode}
          isConnecting={isConnecting}
          statusMessage={statusMessage}
        />
      )}

      {/* 4. Match Ended / Victory Modal */}
      {inGame && gameState.gameStatus === 'ended' && (
        <GameOverModal
          gameState={gameState}
          localPlayerId={localPlayerId}
          isHost={isHost}
          onRematch={handleRematch}
          onReturnToLobby={handleReturnToLobby}
        />
      )}

      {/* 5. GitHub Pages Free Hosting Guide */}
      <GitHubExportGuide
        isOpen={showExportGuide}
        onClose={() => setShowExportGuide(false)}
      />
    </main>
  );
}
