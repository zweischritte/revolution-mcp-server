import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp: ts }) => {
  return `${ts} [${level}] ${message}`;
});

export const logger = createLogger({
  level: process.env.REVOLUTION_LOG_LEVEL ?? "info",
  format: combine(timestamp(), logFormat),
  transports: [new transports.Console({ format: combine(colorize(), timestamp(), logFormat) })]
});

export type Logger = typeof logger;
