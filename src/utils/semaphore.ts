// ============================================================================
// Semaphore — async concurrency limiter
// ============================================================================

/**
 * Simple async semaphore for limiting concurrent access to a resource.
 * Uses a promise-based queue to manage waiting callers.
 */
export class Semaphore {
  private permits: number;
  private waiting: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  /**
   * Acquire a permit. Resolves immediately if permits available,
   * otherwise waits until a permit is released.
   */
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    // No permits available - queue the caller
    // Permit will be handed off directly by release() (no increment/decrement)
    await new Promise<void>(resolve => this.waiting.push(resolve));
  }

  /**
   * Try to acquire a permit without waiting.
   * Returns true if acquired, false if no permits available.
   */
  tryAcquire(): boolean {
    if (this.permits > 0) {
      this.permits--;
      return true;
    }
    return false;
  }

  /**
   * Release a permit, allowing the next waiting caller to proceed.
   */
  release(): void {
    const next = this.waiting.shift();
    if (next) {
      // Hand off permit directly to waiter (don't increment, avoiding race condition)
      next();
    } else {
      this.permits++;
    }
  }

  /**
   * Get current available permits (for logging/debugging).
   */
  get available(): number {
    return this.permits;
  }

  /**
   * Get number of waiting callers (for logging/debugging).
   */
  get waitingCount(): number {
    return this.waiting.length;
  }
}
