const Redis = require('redis');

class CacheManager {
  constructor() {
    this.client = null;
    this.connected = false;
    this.memoryCache = new Map(); // Fallback for local/dev without Redis
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
          reconnectStrategy: (retries) => {
            if (retries > 3) { // Reduced retries for faster fallback
              if (this.connected !== false) {
                console.warn('⚠️ Redis ulanishini to\'xtatdi. Tizim In-Memory kesh bilan ishlaydi.');
              }
              this.connected = false;
              return false; 
            }
            return Math.min(retries * 500, 2000);
          },
          connectTimeout: 2000
        },
      });

      this.client.on('error', (err) => {
        if (this.connected) {
          console.warn('⚠️ Redis Error:', err.message);
          this.connected = false;
        }
      });

      this.client.on('connect', () => {
        console.log('✅ Redis Cache Connected');
        this.connected = true;
      });

      await this.client.connect();
    } catch (err) {
      console.warn('⚠️ Redis ulanishda xato. Tizim In-Memory kesh bilan ishlaydi.');
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
    // 1. Try Redis
    if (this.connected) {
      try {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        this.connected = false;
      }
    }

    // 2. Fallback to Memory
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    
    if (entry.expiry && entry.expiry < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value, ttl = 300) {
    // 1. Try Redis
    if (this.connected) {
      try {
        const options = ttl ? { EX: ttl } : undefined;
        await this.client.set(key, JSON.stringify(value), options);
        return true;
      } catch (error) {
        this.connected = false;
      }
    }

    // 2. Fallback to Memory
    this.memoryCache.set(key, {
      value,
      expiry: ttl ? Date.now() + ttl * 1000 : null
    });
    return true;
  }

  async del(key) {
    if (this.connected) {
      try {
        await this.client.del(key);
      } catch (e) { this.connected = false; }
    }
    this.memoryCache.delete(key);
    return true;
  }

  async delPattern(pattern) {
    if (this.connected) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) await this.client.del(keys);
      } catch (e) { this.connected = false; }
    }

    // Memory pattern deletion
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) this.memoryCache.delete(key);
    }
    return true;
  }
  
  // Clean memory cache periodically
  startCleanup() {
     setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of this.memoryCache.entries()) {
           if (entry.expiry && entry.expiry < now) this.memoryCache.delete(key);
        }
     }, 60000);
  }

  async invalidateEntity(entityType, businessId) {
    if (!businessId) return;

    // Pattern to catch all list variations: entity:*:businessId:*
    // This catches "products:list:1:...", "products:barcode:1:...", etc.
    const pattern = `${entityType}:*:${businessId}:*`;
    await this.delPattern(pattern);
    
    // Also clear specific detail caches e.g., "product:1:123"
    await this.delPattern(`${entityType.slice(0, -1)}:${businessId}:*`);
    
    // Clear related reports as they depend on this data
    if (['sales', 'products', 'expenses', 'debts'].includes(entityType)) {
      await this.delPattern(`report:*:${businessId}:*`);
      await this.delPattern(`report:${businessId}:*`);
    }
  }
}

const manager = new CacheManager();
manager.startCleanup();
module.exports = manager;

