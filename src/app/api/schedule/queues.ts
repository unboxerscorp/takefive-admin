import { getRedisClient } from '@/misc/redis';
import { Queue } from 'bullmq';

const getQueues = async ({ target }: { target: "prod" | "dev" }) => {
    const queueOptions = {
        connection: await getRedisClient({ target }),
        defaultJobOptions: {
            removeOnComplete: { count: 100, age: 60 * 60 * 24 },
            removeOnFail: { count: 100, age: 60 * 60 * 24 * 7 }
        }
    }

    const matchingQueue = new Queue('matchingQueue', queueOptions);
    const notificationQueue = new Queue('notificationQueue', queueOptions);
    const testQueue = new Queue('testQueue', queueOptions);

    const queues: Record<string, Queue> = {
        matchingQueue,
        notificationQueue,
        testQueue,
    };

    return queues;
}


export { getQueues };