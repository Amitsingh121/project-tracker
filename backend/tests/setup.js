process.env.NODE_ENV = 'test';
import 'dotenv/config';
import { db } from '../src/config/db.js';

// Warm up the Neon DB connection (free tier suspends after inactivity)
export async function setup() {
  let retries = 3;
  while (retries > 0) {
    try {
      await db.$queryRaw`SELECT 1`;
      return;
    } catch {
      retries--;
      if (retries > 0) await new Promise((r) => setTimeout(r, 3000));
    }
  }
}
