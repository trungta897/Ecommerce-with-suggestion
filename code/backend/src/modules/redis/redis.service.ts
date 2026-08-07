import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  onModuleInit() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redisClient.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.redisClient.incr(key);
  }

  // Hash Methods
  async hset(key: string, field: string, value: string): Promise<number> {
    return this.redisClient.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.redisClient.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.redisClient.hgetall(key);
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return this.redisClient.hdel(key, ...fields);
  }

  async hincrby(
    key: string,
    field: string,
    increment: number,
  ): Promise<number> {
    return this.redisClient.hincrby(key, field, increment);
  }

  // Set Methods
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.redisClient.sadd(key, ...members);
  }

  async spop(key: string, count?: number): Promise<string[]> {
    if (count) {
      return this.redisClient.spop(key, count);
    }
    const val = await this.redisClient.spop(key);
    return val ? [val] : [];
  }
}
