import { Server } from 'net';

declare global {
    var sshTunnelServer: Server | null;
    var redisClient: Redis | null;

    type Trigger = {
        type: "repeat" | "once" | "now";
        data: any;
    };
}

export { };