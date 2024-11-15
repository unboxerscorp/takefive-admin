/* eslint-disable no-var */
import { Server } from 'net';

declare global {
    var sshTunnelServer: Server | null;
    var redisClient: Redis | null;

    type TriggerDataType = "repeat" | "delay" | "now";
    type Trigger = {
        type: TriggerDataType;
        data?: unknown;
    };
}

export { };