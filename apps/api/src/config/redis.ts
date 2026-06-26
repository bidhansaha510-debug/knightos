import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { env } from './env.js';

class MemoryRedis extends EventEmitter {
  private store = new Map<string, Record<string, string>>();
  private ttls = new Map<string, NodeJS.Timeout>();

  constructor() {
    super();
    // Simulate connection event asynchronously
    setTimeout(() => {
      this.emit('connect');
    }, 50);
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple glob-to-regex replacement for patterns like 'seek:*'
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.store.keys()).filter((k) => regex.test(k));
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.store.get(key) || {};
  }

  async hset(key: string, arg1: any, arg2?: any): Promise<number> {
    let current = this.store.get(key) || {};
    if (typeof arg1 === 'object' && arg1 !== null) {
      // Overload: hset(key, { field1: val1, field2: val2 })
      for (const [k, v] of Object.entries(arg1)) {
        current[k] = String(v);
      }
    } else if (typeof arg1 === 'string' && arg2 !== undefined) {
      // Overload: hset(key, field, value)
      current[arg1] = String(arg2);
    }
    this.store.set(key, current);
    return 1;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const existing = this.ttls.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.ttls.delete(key);
    }, seconds * 1000);
    // Unref timer so it doesn't block the process exit
    timer.unref?.();
    this.ttls.set(key, timer);
    return 1;
  }

  async hget(key: string, field: string): Promise<string | null> {
    const data = this.store.get(key);
    if (!data) return null;
    return data[field] !== undefined ? data[field] : null;
  }

  async del(key: string): Promise<number> {
    const timer = this.ttls.get(key);
    if (timer) {
      clearTimeout(timer);
      this.ttls.delete(key);
    }
    const deleted = this.store.delete(key);
    return deleted ? 1 : 0;
  }

  async hdel(key: string, field: string): Promise<number> {
    const data = this.store.get(key);
    if (!data) return 0;
    if (field in data) {
      delete data[field];
      this.store.set(key, data);
      return 1;
    }
    return 0;
  }
}

// Use actual Redis in production if a valid non-local REDIS_URL is provided
const isLocal = env.REDIS_URL.includes('localhost') || env.REDIS_URL.includes('127.0.0.1');
const useActualRedis = env.REDIS_URL && 
  (env.REDIS_URL.startsWith('redis://') || env.REDIS_URL.startsWith('rediss://')) &&
  !isLocal;

export const redis = useActualRedis
  ? new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  : (new MemoryRedis() as any);

if (useActualRedis) {
  redis.on('error', (err: any) => {
    console.error('Redis connection error:', err.message);
  });
  redis.on('connect', () => {
    console.log('✓ Connected to production Redis client');
  });
} else {
  redis.on('connect', () => {
    console.log('✓ Connected to In-Memory Redis Emulator');
  });
}
