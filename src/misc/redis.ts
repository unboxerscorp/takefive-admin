import getLogger from "@/misc/logger";
import Redis from "ioredis";
import { createTunnel } from "tunnel-ssh";

const ENVIRONMENT = process.env.ENVIRONMENT || "dev";
const REDIS_HOST = ENVIRONMENT === "prod" ? "takefive-prod-redis-cluster.j5krht.ng.0001.apn2.cache.amazonaws.com" : "localhost";
const REDIS_PORT = ENVIRONMENT === "prod" ? 6379 : 36379;

if (!global.sshTunnelServer) {
    global.sshTunnelServer = null;
}
if (!global.redisClient) {
    global.redisClient = null;
}

const SSH_PRIVATE_KEY = process.env.SSH_PRIVATE_KEY?.replaceAll(/\\n/g, '\n');

async function createSshTunnelServer({ port }: { port: number }) {
    const [server] = await createTunnel(
        { autoClose: false },
        { port: port },
        {
            username: 'ubuntu',
            host: '13.209.0.109',
            port: 1022,
            privateKey: SSH_PRIVATE_KEY ? SSH_PRIVATE_KEY : undefined,
            keepaliveInterval: 1000,
            readyTimeout: 10000,
        },
        {
            dstAddr: REDIS_HOST,
            dstPort: REDIS_PORT,
        }
    );

    global.sshTunnelServer = server;
}

function createRedisClient({ label, port }: { label: string, port: number }): Redis {
    const redis = new Redis({
        host: "localhost",
        port: port,
        retryStrategy: (times) => Math.min(times * 30, 1000),
    });

    const logger = getLogger(label);

    redis.on("connect", () => {
        logger.info("Redis is trying to connect...");
    });

    redis.on("ready", () => {
        logger.info("Redis connection established successfully!");
    });

    redis.on("error", (err) => {
        logger.error("Redis connection error:", err);
    });

    redis.on("end", () => {
        logger.info("Redis connection has been closed.");
    });

    redis.on("reconnecting", (delay: number) => {
        logger.info(`Redis reconnecting in ${delay}ms...`);
    });

    return redis;
}

export const getRedisClient = async (): Promise<Redis> => {
    const randomPort = Math.floor(Math.random() * 10000) + 30000;
    if (!global.sshTunnelServer && ENVIRONMENT !== "prod") {
        try {
            await createSshTunnelServer({ port: randomPort });
        } catch (error) {
            console.error("Error creating SSH tunnel server:", error);
        }
    }
    if (!global.redisClient) {
        global.redisClient = createRedisClient({ label: "takefive-redis", port: randomPort });
    }
    return global.redisClient;
}
