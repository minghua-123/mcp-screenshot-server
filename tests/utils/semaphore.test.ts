import { describe, it, expect } from 'vitest';
import { Semaphore } from '../../src/utils/semaphore.js';

describe('Semaphore', () => {
  describe('acquire() / release() basic flow', () => {
    it('should acquire immediately when permits are available', async () => {
      const sem = new Semaphore(2);
      expect(sem.available).toBe(2);

      await sem.acquire();
      expect(sem.available).toBe(1);

      await sem.acquire();
      expect(sem.available).toBe(0);
    });

    it('should restore permits on release', async () => {
      const sem = new Semaphore(1);
      await sem.acquire();
      expect(sem.available).toBe(0);

      sem.release();
      expect(sem.available).toBe(1);
    });
  });

  describe('concurrent acquire respects max limit', () => {
    it('should block when no permits available and resolve on release', async () => {
      const sem = new Semaphore(1);
      await sem.acquire(); // takes the only permit

      let acquired = false;
      const pending = sem.acquire().then(() => {
        acquired = true;
      });

      // Give microtask queue a tick — should still be blocked
      await Promise.resolve();
      expect(acquired).toBe(false);
      expect(sem.waitingCount).toBe(1);

      sem.release(); // hand off to waiter
      await pending;
      expect(acquired).toBe(true);
    });

    it('should limit concurrency to the configured max', async () => {
      const sem = new Semaphore(2);
      await sem.acquire();
      await sem.acquire();
      expect(sem.available).toBe(0);

      const results: number[] = [];
      const p1 = sem.acquire().then(() => results.push(1));
      const p2 = sem.acquire().then(() => results.push(2));

      expect(sem.waitingCount).toBe(2);

      sem.release();
      await p1;
      sem.release();
      await p2;

      expect(results).toEqual([1, 2]);
    });
  });

  describe('tryAcquire()', () => {
    it('should return true when permits are available', () => {
      const sem = new Semaphore(1);
      expect(sem.tryAcquire()).toBe(true);
      expect(sem.available).toBe(0);
    });

    it('should return false when at capacity', () => {
      const sem = new Semaphore(1);
      sem.tryAcquire();
      expect(sem.tryAcquire()).toBe(false);
    });
  });

  describe('release() after tryAcquire', () => {
    it('should restore permit after tryAcquire', () => {
      const sem = new Semaphore(1);
      sem.tryAcquire();
      expect(sem.available).toBe(0);
      sem.release();
      expect(sem.available).toBe(1);
    });

    it('should unblock a waiter after tryAcquire + release', async () => {
      const sem = new Semaphore(1);
      sem.tryAcquire();

      let acquired = false;
      const pending = sem.acquire().then(() => {
        acquired = true;
      });

      await Promise.resolve();
      expect(acquired).toBe(false);

      sem.release();
      await pending;
      expect(acquired).toBe(true);
    });
  });

  describe('waitingCount', () => {
    it('should return 0 when no one is waiting', () => {
      const sem = new Semaphore(2);
      expect(sem.waitingCount).toBe(0);
    });

    it('should return the correct number of waiting callers', async () => {
      const sem = new Semaphore(1);
      await sem.acquire();

      const p1 = sem.acquire();
      const p2 = sem.acquire();
      const p3 = sem.acquire();

      expect(sem.waitingCount).toBe(3);

      sem.release();
      await p1;
      expect(sem.waitingCount).toBe(2);

      sem.release();
      await p2;
      expect(sem.waitingCount).toBe(1);

      sem.release();
      await p3;
      expect(sem.waitingCount).toBe(0);
    });
  });

  describe('FIFO ordering of waiters', () => {
    it('should resolve waiters in the order they were enqueued', async () => {
      const sem = new Semaphore(1);
      await sem.acquire(); // exhaust permits

      const order: string[] = [];

      const p1 = sem.acquire().then(() => order.push('first'));
      const p2 = sem.acquire().then(() => order.push('second'));
      const p3 = sem.acquire().then(() => order.push('third'));

      // Release one at a time and await each
      sem.release();
      await p1;

      sem.release();
      await p2;

      sem.release();
      await p3;

      expect(order).toEqual(['first', 'second', 'third']);
    });
  });
});
