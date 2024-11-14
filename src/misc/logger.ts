import { createLogger, transports, format } from "winston";
import { TransformableInfo } from "logform";

const ENVIRONMENT = process.env.ENVIRONMENT || "dev";

const getLogger = (label: string) =>
  createLogger({
    transports: [
      ENVIRONMENT === "prod"
        ? new transports.Console({
          level: "debug",
          format: format.combine(
            format.label({ label: `[${label}]` }),
            format.timestamp({
              format: "YYYY-MM-DD HH:mm:ss.SSS",
            }),
            format.printf(
              (info: TransformableInfo) =>
                `[${ENVIRONMENT}] ${info.timestamp} - ${info.level}: ${info.label} ${info.message}`
            )
          ),
        })
        : new transports.Console({
          level: "debug",
          format: format.combine(
            format.label({ label: `[${label}]` }),
            format.timestamp({
              format: "YYYY-MM-DD HH:mm:ss.SSS",
            }),
            format.colorize(),
            format.printf(
              (info: TransformableInfo) =>
                `[${ENVIRONMENT}] ${info.timestamp} - ${info.level}: ${info.label} ${info.message}`
            )
          ),
        }),
    ],
  });

export default getLogger;
