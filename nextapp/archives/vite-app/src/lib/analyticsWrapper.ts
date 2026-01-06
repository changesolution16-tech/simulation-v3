type AnalyticsEvent = {
  name: string;
  properties?: Record<string, any>;
};

class AnalyticsWrapper {
  private queue: AnalyticsEvent[] = [];
  private isOnline: boolean = navigator.onLine;
  private maxQueueSize: number = 100;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  track(eventName: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href
      }
    };

    if (!this.isOnline) {
      this.queueEvent(event);
      return;
    }

    this.sendEvent(event).catch(error => {
      console.warn('Analytics tracking failed, queuing event:', error);
      this.queueEvent(event);
    });
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await Promise.race([
        this.sendToAnalytics(event),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Analytics timeout')), 5000)
        )
      ]);
    } catch (error) {
      throw error;
    }
  }

  private async sendToAnalytics(event: AnalyticsEvent): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      if ((window as any).gtag) {
        (window as any).gtag('event', event.name, event.properties);
      }

      if ((window as any).plausible) {
        (window as any).plausible(event.name, { props: event.properties });
      }

      if ((window as any).mixpanel) {
        (window as any).mixpanel.track(event.name, event.properties);
      }
    } catch (error) {
      console.warn('Analytics provider error:', error);
    }
  }

  private queueEvent(event: AnalyticsEvent) {
    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift();
    }
    this.queue.push(event);
  }

  private handleOnline() {
    this.isOnline = true;
    this.flushQueue();
  }

  private handleOffline() {
    this.isOnline = false;
  }

  private async flushQueue() {
    while (this.queue.length > 0 && this.isOnline) {
      const event = this.queue.shift();
      if (event) {
        try {
          await this.sendEvent(event);
        } catch (error) {
          console.warn('Failed to send queued event:', error);
          this.queue.unshift(event);
          break;
        }
      }
    }
  }

  pageView(path?: string) {
    this.track('page_view', {
      page: path || window.location.pathname
    });
  }

  identify(userId: string, traits?: Record<string, any>) {
    try {
      if ((window as any).gtag) {
        (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
          user_id: userId
        });
      }

      if ((window as any).mixpanel) {
        (window as any).mixpanel.identify(userId);
        if (traits) {
          (window as any).mixpanel.people.set(traits);
        }
      }
    } catch (error) {
      console.warn('Analytics identify error:', error);
    }
  }
}

export const analytics = new AnalyticsWrapper();

export const safeTrack = (eventName: string, properties?: Record<string, any>) => {
  try {
    analytics.track(eventName, properties);
  } catch (error) {
    console.warn('Safe track failed:', error);
  }
};

export const safePageView = (path?: string) => {
  try {
    analytics.pageView(path);
  } catch (error) {
    console.warn('Safe page view failed:', error);
  }
};

export const safeIdentify = (userId: string, traits?: Record<string, any>) => {
  try {
    analytics.identify(userId, traits);
  } catch (error) {
    console.warn('Safe identify failed:', error);
  }
};
