import { supabase } from './supabase';

/**
 * Session Keepalive Manager
 * Prevents session expiration during long simulations by periodically refreshing the auth token
 */
export class SessionKeepaliveManager {
  private static intervalId: number | null = null;
  private static readonly REFRESH_INTERVAL = 5 * 60 * 1000; // Refresh every 5 minutes

  /**
   * Start the keepalive mechanism
   * Should be called when starting a simulation
   */
  static start(): void {
    if (this.intervalId) {
      console.log('[SessionKeepalive] Already running');
      return;
    }

    console.log('[SessionKeepalive] Starting session keepalive (refresh every 5 minutes)');

    // Immediate check
    this.refreshSession();

    // Set up periodic refresh
    this.intervalId = window.setInterval(() => {
      this.refreshSession();
    }, this.REFRESH_INTERVAL);
  }

  /**
   * Stop the keepalive mechanism
   * Should be called when exiting a simulation
   */
  static stop(): void {
    if (this.intervalId) {
      console.log('[SessionKeepalive] Stopping session keepalive');
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Manually refresh the session
   */
  static async refreshSession(): Promise<boolean> {
    if (!supabase) {
      return false;
    }

    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        console.warn('[SessionKeepalive] Failed to refresh session:', error.message);
        return false;
      }

      if (session) {
        console.log('[SessionKeepalive] Session refreshed successfully');
        return true;
      }

      console.warn('[SessionKeepalive] No session returned from refresh');
      return false;
    } catch (error) {
      console.error('[SessionKeepalive] Exception during refresh:', error);
      return false;
    }
  }

  /**
   * Check if session is valid and refresh if needed
   */
  static async ensureValidSession(): Promise<boolean> {
    if (!supabase) {
      return false;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.warn('[SessionKeepalive] No active session, attempting refresh...');
        return await this.refreshSession();
      }

      // Check if token is about to expire (within 5 minutes)
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;

        if (timeUntilExpiry < 5 * 60) {
          console.log('[SessionKeepalive] Token expiring soon, refreshing...');
          return await this.refreshSession();
        }
      }

      return true;
    } catch (error) {
      console.error('[SessionKeepalive] Error checking session:', error);
      return false;
    }
  }
}
