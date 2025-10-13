import pino from "pino";

export const logger = pino({
  name: "aikyo:server",
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});
