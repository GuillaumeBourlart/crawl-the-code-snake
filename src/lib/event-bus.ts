// src/lib/event-bus.ts
type EventCallback<T = Record<string, unknown>> = (data?: T) => void;

interface EventSubscription {
  unsubscribe: () => void;
}

/**
 * EventBus - A centralized event system to manage application events
 * and avoid circular dependencies between hooks and components.
 */
class EventBus {
  private events: Record<string, EventCallback[]> = {};
  private debugMode: boolean = false;

  constructor() {
    // Enable debug logging in development
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  /**
   * Subscribe to an event
   * @param eventName The name of the event to listen for
   * @param callback The function to call when the event is emitted
   * @returns An object with an unsubscribe method
   */
  public subscribe<T = Record<string, unknown>>(eventName: string, callback: EventCallback<T>): EventSubscription {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push(callback);
    this.log(`Subscribed to ${eventName}, current subscribers: ${this.events[eventName].length}`);

    return {
      unsubscribe: () => {
        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
        this.log(`Unsubscribed from ${eventName}, remaining subscribers: ${this.events[eventName].length}`);
      }
    };
  }

  /**
   * Emit an event with optional data
   * @param eventName The name of the event to emit
   * @param data Optional data to pass to the event handlers
   */
  public emit<T = Record<string, unknown>>(eventName: string, data?: T): void {
    this.log(`Emitting ${eventName}${data ? ': ' + JSON.stringify(data) : ''}`);

    if (!this.events[eventName]) {
      return;
    }

    this.events[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}:`, error);
      }
    });
  }

  /**
   * Set up a visibility change listener that emits events when the document
   * visibility state changes
   */
  public setupVisibilityListener(): EventSubscription {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      this.emit('visibilityChange', { isVisible });
      
      if (isVisible) {
        this.emit('documentBecameVisible');
      } else {
        this.emit('documentBecameHidden');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    this.log('Set up visibility change listener');

    return {
      unsubscribe: () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        this.log('Removed visibility change listener');
      }
    };
  }

  /**
   * Log a message to the console if debug mode is enabled
   * @param message The message to log
   * @param data Optional data to log
   */
  private log(message: string, data?: unknown): void {
    if (this.debugMode) {
      if (data) {
        console.log(`[EventBus] ${message}`, data);
      } else {
        console.log(`[EventBus] ${message}`);
      }
    }
  }

  /**
   * Clear all event listeners (useful for testing)
   */
  public clear(): void {
    this.events = {};
    this.log('All event listeners cleared');
  }
}

// Create a singleton instance of the event bus
const eventBus = new EventBus();

/**
 * VisibilityManager - A utility to manage document visibility
 * and handle state refreshes when tab becomes active
 */
class VisibilityManager {
  private initialized: boolean = false;
  private subscription: EventSubscription | null = null;

  /**
   * Initialize the visibility manager
   * This should be called once in the App component
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }
    
    this.subscription = eventBus.setupVisibilityListener();
    this.initialized = true;
  }

  /**
   * Clean up the visibility manager
   * This should be called when the app unmounts
   */
  public cleanup(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.initialized = false;
  }

  /**
   * Check if the document is currently visible
   */
  public isDocumentVisible(): boolean {
    return document.visibilityState === 'visible';
  }
}

// Create a singleton instance of the visibility manager
const visibilityManager = new VisibilityManager();

// Export the singletons
export { eventBus, visibilityManager };

// Define event names as constants to prevent typos
export const EVENTS = {
  // Authentication events
  AUTH_STATE_CHANGED: 'auth:stateChanged',
  AUTH_SIGNED_IN: 'auth:signedIn',
  AUTH_SIGNED_OUT: 'auth:signedOut',
  AUTH_SESSION_REFRESHED: 'auth:sessionRefreshed',
  AUTH_PROFILE_LOADED: 'auth:profileLoaded',
  AUTH_ERROR: 'auth:error',
  
  // Visibility events
  VISIBILITY_CHANGED: 'visibilityChange',
  DOCUMENT_BECAME_VISIBLE: 'documentBecameVisible',
  DOCUMENT_BECAME_HIDDEN: 'documentBecameHidden',
  
  // Skin events
  SKINS_LOADED: 'skins:loaded',
  SKINS_LOADING: 'skins:loading',
  SKINS_REFRESHING: 'skins:refreshing',
  SKINS_REFRESH_COMPLETE: 'skins:refresh_complete',
  SKIN_SELECTED: 'skins:skin_selected',
  SKINS_SELECTED: 'skins:selected',
  SKINS_PURCHASED: 'skins:purchased',
  SKINS_ERROR: 'skins:error',
  
  // Loading events
  LOADING_STARTED: 'loading:started',
  LOADING_COMPLETED: 'loading:completed',
  LOADING_FAILED: 'loading:failed',
  LOADING_CLEARED: 'loading:cleared',
  LOADING_RESET_ALL: 'loading:reset_all',
};