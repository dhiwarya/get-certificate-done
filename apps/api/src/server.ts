import { app } from "./app.js";
import { env } from "./env.js";
import { prisma } from "./prisma.js";

const server = app.listen(env.PORT, "0.0.0.0", () => console.log(`API listening on ${env.PORT}`));

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
