import { GameState, PlayerInput, NetworkMessage } from '../game/types';

export interface P2PCallbacks {
  onStateUpdate: (state: GameState) => void;
  onPlayerInput?: (playerId: string, input: PlayerInput) => void;
  onPlayerJoin?: (playerId: string, playerInfo: any) => void;
  onPlayerLeave?: (playerId: string) => void;
  onStatusChange: (status: 'disconnected' | 'connecting' | 'connected' | 'error', message?: string) => void;
  onPingUpdate?: (pingMs: number) => void;
  onRoomCodeAssigned?: (newCode: string) => void;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

export class P2PNetworkManager {
  private peer: any = null;
  private connections: Map<string, any> = new Map();
  private hostConnection: any = null;
  private broadcastChannel: BroadcastChannel | null = null;
  public isHost: boolean = false;
  public myId: string = '';
  public roomCode: string = '';
  private callbacks: P2PCallbacks;
  private lastPingSent: number = 0;
  private pingInterval: any = null;
  private handshakeInterval: any = null;
  private connectTimeout: any = null;
  private hasReceivedState: boolean = false;
  private lastBroadcastedState: GameState | null = null;
  private unloadListener: (() => void) | null = null;

  constructor(callbacks: P2PCallbacks) {
    this.callbacks = callbacks;
    this.myId = `p_${Math.random().toString(36).substring(2, 9)}`;

    if (typeof window !== 'undefined') {
      this.unloadListener = () => this.destroy();
      window.addEventListener('beforeunload', this.unloadListener);
    }
  }

  public async initHost(roomCode: string, playerInfo: any): Promise<string> {
    this.isHost = true;
    this.roomCode = roomCode.toUpperCase();
    this.callbacks.onStatusChange('connecting', `Registering room ${this.roomCode} on WebRTC network...`);

    // BroadcastChannel for instant local multi-tab sync on same origin
    this.setupBroadcastChannel();

    if (typeof window === 'undefined') return this.myId;

    try {
      const { Peer } = await import('peerjs');
      const peerId = `cosmic2d-${this.roomCode.toLowerCase()}`;

      return new Promise((resolve) => {
        this.peer = new Peer(peerId, {
          debug: 1,
          config: {
            iceServers: ICE_SERVERS,
          },
        });

        this.peer.on('open', (id: string) => {
          this.callbacks.onStatusChange('connected', `Room ${this.roomCode} online. Share code with your friend!`);
          this.startPingMonitor();
          resolve(id);
        });

        this.peer.on('connection', (conn: any) => {
          this.handleIncomingClientConnection(conn);
        });

        this.peer.on('error', (err: any) => {
          console.warn('[P2P Host Error]', err);

          if (err.type === 'unavailable-id') {
            // Room code was taken or lingering from a previous refresh:
            // Append random suffix and notify app of new room code
            const newCode = `${this.roomCode}${Math.floor(Math.random() * 9 + 1)}`;
            this.roomCode = newCode;
            this.callbacks.onRoomCodeAssigned?.(newCode);
            this.callbacks.onStatusChange('connecting', `Code occupied, assigned room ${newCode}...`);

            // Retry with adjusted peerId
            const altPeerId = `cosmic2d-${newCode.toLowerCase()}`;
            try {
              this.peer?.destroy();
            } catch (e) {}

            this.peer = new Peer(altPeerId, {
              debug: 1,
              config: { iceServers: ICE_SERVERS },
            });

            this.peer.on('open', (id: string) => {
              this.callbacks.onStatusChange('connected', `Room ${this.roomCode} online. Share code: ${this.roomCode}`);
              this.startPingMonitor();
              resolve(id);
            });

            this.peer.on('connection', (c: any) => this.handleIncomingClientConnection(c));
          } else {
            this.callbacks.onStatusChange('error', `WebRTC Host note: ${err.type || err.message}`);
          }
        });
      });
    } catch (err: any) {
      console.warn('WebRTC init failed, using fallback', err);
      this.callbacks.onStatusChange('connected', `Host active (local channel). Room: ${this.roomCode}`);
      return this.myId;
    }
  }

  public async joinRoom(roomCode: string, playerInfo: any): Promise<void> {
    this.isHost = false;
    this.roomCode = roomCode.toUpperCase();
    this.hasReceivedState = false;
    this.callbacks.onStatusChange('connecting', `Connecting to host room ${this.roomCode}...`);

    this.setupBroadcastChannel();

    if (typeof window === 'undefined') return;

    // Timeout if host not reached within 14s
    this.connectTimeout = setTimeout(() => {
      if (!this.hasReceivedState) {
        this.callbacks.onStatusChange(
          'error',
          `Could not connect to room "${this.roomCode}". Ensure your friend has created the room and is in the match.`
        );
      }
    }, 14000);

    try {
      const { Peer } = await import('peerjs');
      const clientPeerId = `cosmic-client-${this.myId}`;

      this.peer = new Peer(clientPeerId, {
        debug: 1,
        config: {
          iceServers: ICE_SERVERS,
        },
      });

      const hostPeerId = `cosmic2d-${this.roomCode.toLowerCase()}`;

      this.peer.on('open', () => {
        // Connect with reliable: true for guaranteed join handshake & packets
        const conn = this.peer.connect(hostPeerId, { reliable: true });
        this.hostConnection = conn;

        const onConnected = () => {
          this.callbacks.onStatusChange('connecting', `P2P link open with host. Joining match...`);

          const sendJoin = () => {
            const joinMsg: NetworkMessage = {
              type: 'join',
              senderId: this.myId,
              payload: playerInfo,
              timestamp: Date.now(),
            };
            if (conn.open) {
              try {
                conn.send(joinMsg);
              } catch (e) {}
            }
            this.broadcastChannel?.postMessage(joinMsg);
          };

          // Send initial join
          sendJoin();

          // Handshake retry loop until acknowledged or first state arrives
          if (this.handshakeInterval) clearInterval(this.handshakeInterval);
          let attempts = 0;
          this.handshakeInterval = setInterval(() => {
            attempts++;
            if (this.hasReceivedState || attempts > 10) {
              if (this.handshakeInterval) clearInterval(this.handshakeInterval);
              return;
            }
            sendJoin();
          }, 600);

          this.startPingMonitor();
        };

        if (conn.open) {
          onConnected();
        } else {
          conn.on('open', onConnected);
        }

        conn.on('data', (data: any) => {
          this.handleIncomingMessage(data);
        });

        conn.on('close', () => {
          this.callbacks.onStatusChange('disconnected', 'Disconnected from host room');
        });

        conn.on('error', (err: any) => {
          console.warn('[P2P Client Conn Error]', err);
        });
      });

      this.peer.on('error', (err: any) => {
        console.warn('[P2P Client Error]', err);
        if (err.type === 'peer-unavailable') {
          this.callbacks.onStatusChange(
            'error',
            `Room "${this.roomCode}" not found. Verify the code with the host.`
          );
        }
      });
    } catch (err) {
      console.warn('WebRTC client init error', err);
      this.callbacks.onStatusChange('error', 'WebRTC not available in this browser environment.');
    }
  }

  private setupBroadcastChannel() {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    try {
      this.broadcastChannel = new BroadcastChannel(`cosmic2d_arena_${this.roomCode}`);
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data as NetworkMessage;
        if (!msg || msg.senderId === this.myId) return; // ignore self
        this.handleIncomingMessage(msg);
      };
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }
  }

  private handleIncomingClientConnection(conn: any) {
    const registerConnection = () => {
      this.connections.set(conn.peer, conn);

      // Immediately push latest authoritative game state to the joining peer
      if (this.lastBroadcastedState) {
        try {
          conn.send({
            type: 'state_sync',
            senderId: this.myId,
            payload: this.lastBroadcastedState,
            timestamp: Date.now(),
          });
        } catch (e) {}
      }
    };

    if (conn.open) {
      registerConnection();
    } else {
      conn.on('open', registerConnection);
    }

    conn.on('data', (data: any) => {
      // Ensure connection is registered
      if (!this.connections.has(conn.peer)) {
        this.connections.set(conn.peer, conn);
      }
      this.handleIncomingMessage(data, conn);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      if (conn._playerId) {
        this.callbacks.onPlayerLeave?.(conn._playerId);
      }
    });

    conn.on('error', (err: any) => {
      console.warn('[P2P Incoming Conn Error]', err);
    });
  }

  private handleIncomingMessage(msg: NetworkMessage, conn?: any) {
    if (!msg || typeof msg !== 'object') return;

    switch (msg.type) {
      case 'join':
        if (this.isHost) {
          if (conn) {
            conn._playerId = msg.senderId;
          }
          this.callbacks.onPlayerJoin?.(msg.senderId, msg.payload);

          // Acknowledge join immediately with current state snapshot
          const ackMsg: NetworkMessage = {
            type: 'join_ack',
            senderId: this.myId,
            payload: this.lastBroadcastedState,
            timestamp: Date.now(),
          };
          if (conn && conn.open) {
            try {
              conn.send(ackMsg);
            } catch (e) {}
          }
          try {
            this.broadcastChannel?.postMessage(ackMsg);
          } catch (e) {}
        }
        break;

      case 'join_ack':
        if (!this.isHost) {
          this.hasReceivedState = true;
          if (this.connectTimeout) clearTimeout(this.connectTimeout);
          if (this.handshakeInterval) clearInterval(this.handshakeInterval);
          this.callbacks.onStatusChange('connected', `Connected to room ${this.roomCode}!`);
          if (msg.payload) {
            this.callbacks.onStateUpdate(msg.payload);
          }
        }
        break;

      case 'player_input':
        if (this.isHost) {
          this.callbacks.onPlayerInput?.(msg.senderId, msg.payload);
        }
        break;

      case 'state_sync':
        if (!this.isHost) {
          if (!this.hasReceivedState) {
            this.hasReceivedState = true;
            if (this.connectTimeout) clearTimeout(this.connectTimeout);
            if (this.handshakeInterval) clearInterval(this.handshakeInterval);
            this.callbacks.onStatusChange('connected', `Connected to room ${this.roomCode}!`);
          }
          this.callbacks.onStateUpdate(msg.payload);
        }
        break;

      case 'ping':
        if (this.isHost) {
          const pongMsg: NetworkMessage = {
            type: 'pong',
            senderId: this.myId,
            payload: msg.timestamp,
            timestamp: Date.now(),
          };
          if (conn && conn.open) {
            try {
              conn.send(pongMsg);
            } catch (e) {}
          }
          try {
            this.broadcastChannel?.postMessage(pongMsg);
          } catch (e) {}
        }
        break;

      case 'pong':
        if (!this.isHost && msg.payload) {
          const rtt = Date.now() - msg.payload;
          this.callbacks.onPingUpdate?.(Math.max(1, Math.round(rtt / 2)));
        }
        break;

      case 'leave':
        if (this.isHost) {
          this.callbacks.onPlayerLeave?.(msg.senderId);
        }
        break;
    }
  }

  public broadcastState(state: GameState) {
    if (!this.isHost) return;
    this.lastBroadcastedState = state;

    const msg: NetworkMessage = {
      type: 'state_sync',
      senderId: this.myId,
      payload: state,
      timestamp: Date.now(),
    };

    // Send to connected WebRTC peers
    this.connections.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(msg);
        } catch (e) {}
      }
    });

    // Send to local BroadcastChannel (for testing multiple tabs on same machine)
    try {
      this.broadcastChannel?.postMessage(msg);
    } catch (e) {}
  }

  public sendInput(input: PlayerInput) {
    const msg: NetworkMessage = {
      type: 'player_input',
      senderId: this.myId,
      payload: input,
      timestamp: Date.now(),
    };

    if (this.isHost) {
      this.callbacks.onPlayerInput?.(this.myId, input);
    } else {
      if (this.hostConnection && this.hostConnection.open) {
        try {
          this.hostConnection.send(msg);
        } catch (e) {}
      }
      try {
        this.broadcastChannel?.postMessage(msg);
      } catch (e) {}
    }
  }

  private startPingMonitor() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (!this.isHost && this.hostConnection?.open) {
        this.lastPingSent = Date.now();
        try {
          this.hostConnection.send({
            type: 'ping',
            senderId: this.myId,
            timestamp: this.lastPingSent,
          });
        } catch (e) {}
      }
    }, 2000);
  }

  public destroy() {
    if (this.connectTimeout) clearTimeout(this.connectTimeout);
    if (this.handshakeInterval) clearInterval(this.handshakeInterval);
    if (this.pingInterval) clearInterval(this.pingInterval);

    if (this.unloadListener && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.unloadListener);
      this.unloadListener = null;
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch (e) {}
      this.broadcastChannel = null;
    }

    this.connections.forEach((conn) => {
      try {
        conn.close();
      } catch (e) {}
    });
    this.connections.clear();

    if (this.hostConnection) {
      try {
        this.hostConnection.close();
      } catch (e) {}
      this.hostConnection = null;
    }

    if (this.peer) {
      try {
        this.peer.disconnect();
        this.peer.destroy();
      } catch (e) {}
      this.peer = null;
    }
  }
}
