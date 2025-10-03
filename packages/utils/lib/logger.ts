import pino from "pino";

export const logger = pino({
  name: "aikyo:utils",
  level: process.env.LOG_LEVEL || "info",
});
