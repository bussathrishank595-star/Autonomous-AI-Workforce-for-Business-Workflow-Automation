import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

if (connectionString) {
  const pool = new Pool({ 
    connectionString,
    max: 2, // Limit concurrent pool connections to prevent exhausting Supabase connections
    idleTimeoutMillis: 10000,
  });
  const adapter = new PrismaPg(pool);
  prismaInstance = new PrismaClient({ adapter, log: ["query"] });
} else {
  prismaInstance = new PrismaClient({ log: ["query"] });
}

export const prisma = globalForPrisma.prisma || prismaInstance;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
