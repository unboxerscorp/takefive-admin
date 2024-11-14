import { createLogger, transports, format } from "winston";
import { TransformableInfo } from "logform";

const getLogger = (label: string) =>
  createLogger({
    transports: [new transports.Console({
      level: "debug",
      format: format.combine(
        format.label({ label: `[${label}]` }),
        format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss.SSS",
        }),
        format.colorize(),
        format.printf(
          (info: TransformableInfo) =>
            `${info.timestamp} - ${info.level}: ${info.label} ${info.message}`
        )
      ),
    }),
    ],
  });

export default getLogger;
