import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

if (connectionString) {
  const pool = new Pool({ 
    connectionString,
    max: 1, // Restrict each serverless worker container to at most 1 connection
    idleTimeoutMillis: 2000, // Speed up release of idle connection sockets
  });
  const adapter = new PrismaPg(pool);
  prismaInstance = new PrismaClient({ adapter, log: ["query"] });
} else {
  prismaInstance = new PrismaClient({ log: ["query"] });
}

export const prisma = globalForPrisma.prisma || prismaInstance;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
