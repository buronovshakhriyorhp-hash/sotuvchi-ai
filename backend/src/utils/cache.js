const Redis = require('redis');

class CacheManager {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  async connect() {
    if (process.env.NODE_ENV === 'test') {
      this.connected = false;
      return;
    }
    try {
      this.client = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
      });

      this.client.on('error', (err) => console.error('Redis Client Error', err));
      this.client.on('connect', () => {
        console.log('✅ Redis Cache Connected');
        this.connected = true;
      });

      await this.client.connect();
    } catch (err) {
      console.error('Redis connection error:', err.message);
      this.connected = false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
    }
  }

  async get(key) {
    if (!this.connected) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache GET error for ${key}:`, error.message);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    if (!this.connected) return false;
    try {
      const options = ttl ? { EX: ttl } : undefined;
      await this.client.set(key, JSON.stringify(value), options);
      return true;
    } catch (error) {
      console.error(`Cache SET error for ${key}:`, error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.connected) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache DEL error for ${key}:`, error.message);
      return false;
    }
  }

  async delPattern(pattern) {
    if (!this.connected) return false;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error(`Cache DEL PATTERN error for ${pattern}:`, error.message);
      return false;
    }
  }

  async mget(keys) {
    if (!this.connected) return new Array(keys.length).fill(null);
    try {
      const values = await this.client.mGet(keys);
      return values.map((v) => (v ? JSON.parse(v) : null));
    } catch (error) {
      console.error('Cache MGET error:', error.message);
      return new Array(keys.length).fill(null);
    }
  }

  async mset(keyValuePairs, ttl = 300) {
    if (!this.connected) return false;
    try {
      const pipeline = this.client.multi();
      for (const [key, value] of keyValuePairs) {
        pipeline.set(key, JSON.stringify(value), ttl ? { EX: ttl } : undefined);
      }
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache MSET error:', error.message);
      return false;
    }
  }

  // Helper: invalidate all cache related to entities
  async invalidateEntity(entityType) {
    await this.delPattern(`cache:${entityType}:*`);
    await this.delPattern(`list:${entityType}:*`);
  }
}

module.exports = new CacheManager();
