'use client';

import { io, Socket } from 'socket.io-client';
import { portfolioCache } from './redis-cache';

// 🌐 WebSocket Configuration
const WS_URLS = [
  'wss://netuno-backend.onrender.com',
  'ws://127.0.0.1:4000',
  'ws://localhost:4000',
] as const;

interface PositionUpdate {
  address: string;
  mint: string;
  valueUSD: number;
  lastUpdate: string;
}

interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  timestamp: string;
}

// 🎯 WebSocket Events
export type WSEvents = {
  'position-update': PositionUpdate;
  'price-update': PriceUpdate;
  'portfolio-refresh': { address: string };
  'market-data': { prices: Record<string, number> };
};

// 🚀 WebSocket Manager Class
export class WebSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.connect();
  }

  // 🔗 Connect to WebSocket
  private async connect() {
    if (this.isConnecting || this.socket?.connected) return;
    
    this.isConnecting = true;
    
    for (const url of WS_URLS) {
      try {
        console.log(`🔌 Connecting to WebSocket: ${url}`);
        
        this.socket = io(url, {
          transports: ['websocket', 'polling'],
          timeout: 5000,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
        });

        // Setup event listeners
        this.setupEventListeners();
        
        // Wait for connection
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
          
          this.socket!.on('connect', () => {
            clearTimeout(timeout);
            console.log(`✅ WebSocket connected: ${url}`);
            this.reconnectAttempts = 0;
            this.isConnecting = false;
            resolve();
          });
          
          this.socket!.on('connect_error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });
        
        break; // Success, stop trying other URLs
        
      } catch (error) {
        console.warn(`❌ WebSocket failed: ${url}`, error);
        this.socket?.disconnect();
        this.socket = null;
        continue;
      }
    }
    
    this.isConnecting = false;
    
    if (!this.socket?.connected) {
      console.warn('🔌 All WebSocket URLs failed, will retry later');
      this.scheduleReconnect();
    }
  }

  // 🎧 Setup event listeners
  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      this.emit('connected', true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.emit('connected', false);
      if (reason === 'io server disconnect') {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.warn('🔌 WebSocket connection error:', error);
      this.scheduleReconnect();
    });

    // 🔄 Position updates
    this.socket.on('position-update', (data: PositionUpdate) => {
      console.log('📊 Position update received:', data);
      this.emit('position-update', data);
      
      // Invalidate cache for this address
      portfolioCache.invalidatePortfolio(data.address).catch(console.warn);
    });

    // 💰 Price updates
    this.socket.on('price-update', (data: PriceUpdate) => {
      console.log('💰 Price update received:', data);
      this.emit('price-update', data);
    });

    // 🔄 Portfolio refresh signal
    this.socket.on('portfolio-refresh', (data: { address: string }) => {
      console.log('🔄 Portfolio refresh signal:', data);
      this.emit('portfolio-refresh', data);
      
      // Invalidate portfolio cache
      portfolioCache.invalidatePortfolio(data.address).catch(console.warn);
    });

    // 📈 Market data updates
    this.socket.on('market-data', (data: { prices: Record<string, number> }) => {
      console.log('📈 Market data update received');
      this.emit('market-data', data);
    });
  }

  // ⏰ Schedule reconnection
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('🔌 Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`🔌 Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // 🎧 Subscribe to events
  public on<T extends keyof WSEvents>(event: T, callback: (data: WSEvents[T]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  // 🔇 Unsubscribe from events
  public off<T extends keyof WSEvents>(event: T, callback: (data: WSEvents[T]) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // 📢 Emit events to listeners
  private emit<T extends keyof WSEvents>(event: T, data: WSEvents[T]) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.warn(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // 📤 Send message to server
  public send(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('🔌 WebSocket not connected, cannot send message');
    }
  }

  // 📋 Subscribe to address updates
  public subscribeToAddress(address: string) {
    this.send('subscribe-address', { address });
    console.log(`🎯 Subscribed to address updates: ${address}`);
  }

  // 📋 Unsubscribe from address updates
  public unsubscribeFromAddress(address: string) {
    this.send('unsubscribe-address', { address });
    console.log(`🎯 Unsubscribed from address updates: ${address}`);
  }

  // 📊 Get connection status
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // 🔌 Manually disconnect
  public disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.listeners.clear();
    console.log('🔌 WebSocket manually disconnected');
  }

  // 🔄 Manually reconnect
  public reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}

// 🎯 Singleton WebSocket instance
let wsManager: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager();
  }
  return wsManager;
}

// 🎯 React hook for WebSocket
export function useWebSocket() {
  const ws = getWebSocketManager();
  
  return {
    isConnected: ws.isConnected(),
    subscribe: ws.subscribeToAddress.bind(ws),
    unsubscribe: ws.unsubscribeFromAddress.bind(ws),
    on: ws.on.bind(ws),
    off: ws.off.bind(ws),
    send: ws.send.bind(ws),
    reconnect: ws.reconnect.bind(ws),
  };
}

export default WebSocketManager;