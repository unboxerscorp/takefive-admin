import { Server } from 'net';

declare global {
    var sshTunnelServer: Server | null;
    var redisClient: Redis | null;
}

export { };