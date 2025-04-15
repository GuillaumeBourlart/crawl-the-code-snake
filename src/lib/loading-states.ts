// src/lib/loading-states.ts
import { eventBus, EVENTS } from './event-bus';

/**
 * LoadingState - A class to track loading states for different operations
 * to prevent race conditions and duplicate requests
 */
export class LoadingState {
  private loadingOperations: Map<string, boolean> = new Map();
  private timestamps: Map<string, number> = new Map();
  private operationCallbacks: Map<string, (() => Promise<void>)[]> = new Map();
  private operationPromises: Map<string, Promise<void>> = new Map();
  private minLoadingTime: number = 300; // Minimum loading time in ms to prevent flickering
  private debugMode: boolean = false;

  constructor() {
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  /**
   * Start a loading operation
   * @param operationId A unique identifier for the operation
   * @returns True if the operation was started, false if it was already in progress
   */
  public start(operationId: string): boolean {
    if (this.isLoading(operationId)) {
      this.log(`Operation already in progress: ${operationId}`);
      return false;
    }

    this.loadingOperations.set(operationId, true);
    this.timestamps.set(operationId, Date.now());
    this.log(`Started operation: ${operationId}`);
    
    eventBus.emit(EVENTS.LOADING_STARTED, { operationId });
    
    return true;
  }

  /**
   * Complete a loading operation
   * @param operationId A unique identifier for the operation
   */
  public complete(operationId: string): void {
    if (!this.isLoading(operationId)) {
      return;
    }

    // Calculate how long the operation has been running
    const startTime = this.timestamps.get(operationId) || 0;
    const elapsed = Date.now() - startTime;
    
    // If the operation finished too quickly, delay the completion
    // to prevent UI flickering
    if (elapsed < this.minLoadingTime) {
      const delay = this.minLoadingTime - elapsed;
      this.log(`Delaying completion of ${operationId} by ${delay}ms to prevent flickering`);
      
      setTimeout(() => {
        this.loadingOperations.set(operationId, false);
        this.log(`Completed operation: ${operationId}`);
        eventBus.emit(EVENTS.LOADING_COMPLETED, { operationId });
        this.executeQueuedCallbacks(operationId);
      }, delay);
    } else {
      this.loadingOperations.set(operationId, false);
      this.log(`Completed operation: ${operationId}`);
      eventBus.emit(EVENTS.LOADING_COMPLETED, { operationId });
      this.executeQueuedCallbacks(operationId);
    }
  }

  /**
   * Mark a loading operation as failed
   * @param operationId A unique identifier for the operation
   * @param error The error that caused the failure
   */
  public fail(operationId: string, error?: Error): void {
    if (!this.isLoading(operationId)) {
      return;
    }

    this.loadingOperations.set(operationId, false);
    this.log(`Failed operation: ${operationId}`, error);
    eventBus.emit(EVENTS.LOADING_FAILED, { operationId, error });
    this.executeQueuedCallbacks(operationId);
  }

  /**
   * Check if an operation is currently loading
   * @param operationId A unique identifier for the operation
   * @returns True if the operation is loading, false otherwise
   */
  public isLoading(operationId: string): boolean {
    return this.loadingOperations.get(operationId) === true;
  }

  /**
   * Get all currently loading operations
   * @returns An array of operation IDs that are currently loading
   */
  public getAllLoadingOperations(): string[] {
    return Array.from(this.loadingOperations.entries())
      .filter(([_, isLoading]) => isLoading)
      .map(([id]) => id);
  }

  /**
   * Clear the loading state for an operation, forcing it to be treated as complete
   * @param operationId A unique identifier for the operation
   */
  public clearLoadingState(operationId: string): void {
    if (this.loadingOperations.has(operationId)) {
      this.log(`Forcefully clearing loading state for: ${operationId}`);
      this.loadingOperations.set(operationId, false);
      this.timestamps.delete(operationId);
      this.executeQueuedCallbacks(operationId);
      this.operationPromises.delete(operationId);
      eventBus.emit(EVENTS.LOADING_CLEARED, { operationId });
    }
  }
  
  /**
   * Reset all loading states, clearing any stuck operations
   */
  public resetAllLoadingStates(): void {
    const loadingOps = this.getAllLoadingOperations();
    if (loadingOps.length > 0) {
      this.log(`Resetting all loading states: ${loadingOps.join(', ')}`);
      
      loadingOps.forEach(operationId => {
        this.clearLoadingState(operationId);
      });
      
      eventBus.emit(EVENTS.LOADING_RESET_ALL, { operations: loadingOps });
    }
  }

  /**
   * Execute an operation only if it's not already running
   * @param operationId A unique identifier for the operation
   * @param callback The function to execute if the operation is not running
   * @returns A promise that resolves when the operation completes
   */
  public async executeOnce<T>(
    operationId: string, 
    callback: () => Promise<T>
  ): Promise<T> {
    // If the operation is already running, queue this callback to run after it completes
    if (this.isLoading(operationId)) {
      this.log(`Operation ${operationId} already running, adding to queue`);
      
      // Return existing promise if we have one
      if (this.operationPromises.has(operationId)) {
        return this.operationPromises.get(operationId)!.then(() => callback()) as Promise<T>;
      }

      // Otherwise create a new promise that will resolve when the current operation completes
      return new Promise((resolve, reject) => {
        const wrappedCallback = async () => {
          try {
            const result = await callback();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };

        // Queue the callback to run when the current operation completes
        if (!this.operationCallbacks.has(operationId)) {
          this.operationCallbacks.set(operationId, []);
        }
        this.operationCallbacks.get(operationId)!.push(wrappedCallback);
      });
    }

    // Start the operation
    this.start(operationId);
    
    try {
      // Create a promise for this operation
      const promise = callback().finally(() => {
        this.complete(operationId);
        // Remove the promise when it completes
        this.operationPromises.delete(operationId);
      });
      
      // Store the promise for this operation
      this.operationPromises.set(operationId, promise as unknown as Promise<void>);
      
      return promise;
    } catch (error) {
      this.fail(operationId, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Execute all queued callbacks for an operation
   * @param operationId The ID of the operation
   */
  private executeQueuedCallbacks(operationId: string): void {
    const callbacks = this.operationCallbacks.get(operationId) || [];
    if (callbacks.length > 0) {
      this.log(`Executing ${callbacks.length} queued callbacks for ${operationId}`);
      
      // Clear the callbacks before executing them to prevent them from being executed again
      this.operationCallbacks.delete(operationId);
      
      // Execute each callback sequentially
      callbacks.reduce(
        (promise, callback) => promise.then(() => callback()), 
        Promise.resolve()
      ).catch(error => {
        console.error(`Error in queued callback for ${operationId}:`, error);
      });
    }
  }

  /**
   * Log a message to the console if debug mode is enabled
   * @param message The message to log
   * @param data Optional data to log
   */
  private log(message: string, data?: unknown): void {
    if (this.debugMode) {
      if (data) {
        console.log(`[LoadingState] ${message}`, data);
      } else {
        console.log(`[LoadingState] ${message}`);
      }
    }
  }
}

// Create a singleton instance of the loading state tracker
const loadingState = new LoadingState();

export default loadingState;