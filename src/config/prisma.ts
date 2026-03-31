import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

export const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? [
          { level: "query", emit: "event" },
          { level: "error", emit: "stdout" },
        ]
      : [{ level: "error", emit: "stdout" }],
});

if (process.env.NODE_ENV === "development") {
  prisma.$on("query", (e) => {
    logger.debug({ duration: e.duration, query: e.query }, "Prisma query");
  });
}
