import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().default("http://localhost:3000")
});

export const env = schema.parse(process.env);
