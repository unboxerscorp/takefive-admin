import { createTunnel } from 'tunnel-ssh';
import Redis from "ioredis";
import getLogger from '@/misc/logger';

const REDIS_HOST = "takefive-prod-redis-cluster.j5krht.ng.0001.apn2.cache.amazonaws.com"
const REDIS_PORT = 6379

if (!global.sshTunnelServer) {
    global.sshTunnelServer = null;
}
if (!global.redisClient) {
    global.redisClient = null;
}

const SSH_PRIVATE_KEY = process.env.SSH_PRIVATE_KEY?.replaceAll(/\\n/g, '\n');

async function createSshTunnelServer() {
    const [server, _] = await createTunnel(
        { autoClose: false },
        { port: 6380 },
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

function createRedisClient(label: string): Redis {
    const redis = new Redis({
        host: "localhost",
        port: 6380,
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

const getRedisClient = async (): Promise<Redis> => {
    if (!global.sshTunnelServer) {
        await createSshTunnelServer();
    }
    if (!global.redisClient) {
        global.redisClient = createRedisClient("takefive-redis");
    }
    return global.redisClient;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (!key) {
        return Response.json({ error: "No key provided" }, { status: 400 });
    }
    const redis = await getRedisClient();
    const keys = await redis.keys(key);
    const data = Object.create(null);
    for (const key of keys) {
        const value = await redis.get(key);
        if (value) {
            data[key] = JSON.parse(value);
        }
    }
    return Response.json({ data })
}