import getLogger from "@/misc/logger";
import Redis from "ioredis";
import { Server } from "net";
import { createTunnel } from "tunnel-ssh";

const SSH_PRIVATE_KEY = process.env.SSH_PRIVATE_KEY?.replaceAll(/\\n/g, '\n');

let sshTunnelServer: Server | null = null;
let redisClient: Redis | null = null;

async function createOrReuseSshTunnelServer({ port }: { port: number }): Promise<void> {
    if (!sshTunnelServer) {
        const [server] = await createTunnel(
            { autoClose: false },
            { port },
            {
                username: 'ubuntu',
                host: '13.209.0.109',
                port: 1022,
                privateKey: SSH_PRIVATE_KEY || undefined,
                keepaliveInterval: 1000,
                readyTimeout: 10000,
            },
            {
                dstAddr: "takefive-prod-redis-cluster.j5krht.ng.0001.apn2.cache.amazonaws.com",
                dstPort: 6379,
            }
        );
        sshTunnelServer = server;

        sshTunnelServer?.on('close', async () => {
            console.log('SSH Tunnel closed. Reconnecting...');
            try {
                await createOrReuseSshTunnelServer({ port });
            } catch (error) {
                sshTunnelServer = null;
                console.error('Failed to reconnect SSH tunnel:', error);
            }
        });

        console.log('SSH Tunnel server created!');
    }
}

function createOrReuseRedisClient({ label, port }: { label: string; port: number }): Redis {
    if (!redisClient) {
        redisClient = new Redis({
            host: "localhost",
            port,
            retryStrategy: (times) => Math.min(times * 30, 1000),
        });

        const logger = getLogger(label);

        redisClient.on("connect", () => {
            logger.info("Redis is trying to connect...");
        });

        redisClient.on("ready", () => {
            logger.info("Redis connection established successfully!");
        });

        redisClient.on("error", (err) => {
            logger.error("Redis connection error:", err);
        });

        redisClient.on("end", () => {
            logger.info("Redis connection has been closed.");
            redisClient = null; // 연결 종료 시 초기화
        });

        redisClient.on("reconnecting", (delay: number) => {
            logger.info(`Redis reconnecting in ${delay}ms...`);
        });
    }

    return redisClient;
}

export const getRedisClient = async ({ target }: { target: "prod" | "dev" }): Promise<Redis> => {
    const randomPort = Math.floor(Math.random() * 10000) + 10000;
    const port = target === "prod" ? randomPort : 36379;

    if (target === "prod") {
        await createOrReuseSshTunnelServer({ port });
    }

    return createOrReuseRedisClient({ label: "takefive-redis", port });
};
