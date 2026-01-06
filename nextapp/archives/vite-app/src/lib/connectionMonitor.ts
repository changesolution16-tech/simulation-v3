import { supabase, isSupabaseConfigured } from './supabase';

export type ConnectionStatus = 'connected' | 'disconnected' | 'checking' | 'degraded';

export interface ConnectionState {
  status: ConnectionStatus;
  lastChecked: Date;
  consecutiveFailures: number;
  isSupabaseReachable: boolean;
  latency?: number;
}

type ConnectionListener = (state: ConnectionState) => void;

class ConnectionMonitor {
  private listeners: Set<ConnectionListener> = new Set();
  private state: ConnectionState = {
    status: 'checking',
    lastChecked: new Date(),
    consecutiveFailures: 0,
    isSupabaseReachable: false
  };
  private checkInterval?: NodeJS.Timeout;
  private readonly CHECK_INTERVAL_MS = 30000;
  private readonly HEALTH_CHECK_TIMEOUT_MS = 5000;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  start() {
    this.checkConnection();
    this.checkInterval = setInterval(() => {
      this.checkConnection();
    }, this.CHECK_INTERVAL_MS);
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  subscribe(listener: ConnectionListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): ConnectionState {
    return { ...this.state };
  }

  async checkConnection(): Promise<ConnectionState> {
    const startTime = Date.now();

    this.updateState({ status: 'checking', lastChecked: new Date() });

    if (!navigator.onLine) {
      this.updateState({
        status: 'disconnected',
        isSupabaseReachable: false,
        consecutiveFailures: this.state.consecutiveFailures + 1
      });
      return this.state;
    }

    try {
      const isReachable = await this.checkSupabaseConnection();
      const latency = Date.now() - startTime;

      if (isReachable) {
        this.updateState({
          status: 'connected',
          isSupabaseReachable: true,
          consecutiveFailures: 0,
          latency
        });
      } else {
        this.updateState({
          status: this.state.consecutiveFailures >= 2 ? 'disconnected' : 'degraded',
          isSupabaseReachable: false,
          consecutiveFailures: this.state.consecutiveFailures + 1,
          latency
        });
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      this.updateState({
        status: this.state.consecutiveFailures >= 2 ? 'disconnected' : 'degraded',
        isSupabaseReachable: false,
        consecutiveFailures: this.state.consecutiveFailures + 1
      });
    }

    return this.state;
  }

  private async checkSupabaseConnection(): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.HEALTH_CHECK_TIMEOUT_MS);

      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      return !error;
    } catch (error) {
      return false;
    }
  }

  private handleOnline() {
    console.log('Browser detected online status');
    this.checkConnection();
  }

  private handleOffline() {
    console.log('Browser detected offline status');
    this.updateState({
      status: 'disconnected',
      isSupabaseReachable: false,
      consecutiveFailures: this.state.consecutiveFailures + 1
    });
  }

  private updateState(updates: Partial<ConnectionState>) {
    const previousStatus = this.state.status;
    this.state = { ...this.state, ...updates };

    if (previousStatus !== this.state.status) {
      console.log(`Connection status changed: ${previousStatus} -> ${this.state.status}`);
    }

    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Error notifying connection listener:', error);
      }
    });
  }
}

export const connectionMonitor = new ConnectionMonitor();
