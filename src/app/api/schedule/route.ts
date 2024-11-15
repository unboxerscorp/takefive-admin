import { NextRequest, NextResponse } from 'next/server';
import { getQueues } from './queues';
import { Job, RepeatableJob } from 'bullmq';

export async function POST(req: NextRequest): Promise<NextResponse> {
    const target = req.nextUrl.searchParams.get("target");
    if (!target || (target !== "prod" && target !== "dev")) {
        return NextResponse.json(
            { message: 'No target provided' },
            { status: 400 }
        );
    }
    const queues = await getQueues({ target });
    const { queueName, jobName, jobData, trigger }: { queueName: string, jobName: string, jobData: Record<string, unknown>, trigger: Trigger } = await req.json();

    if (!queueName || !jobName || !jobData || !trigger) {
        return NextResponse.json(
            { message: 'Missing required fields: queueName, jobName, jobData and trigger' },
            { status: 400 }
        );
    }

    const queue = queues[queueName];
    const requestData = {
        queueName,
        jobName,
        jobData,
        trigger
    };


    if (!queue) {
        return NextResponse.json(
            { message: 'Invalid queue name' },
            { status: 400 }
        );
    }

    if (!trigger.type) {
        return NextResponse.json(
            { message: 'Missing required field: trigger.type' },
            { status: 400 }
        );
    }

    const jobId = `${queueName}:${jobName}:${trigger.type}` + (trigger.type === "now" ? `:${new Date().getTime()}` : "");

    try {
        switch (trigger.type) {
            case "repeat":
                if (!trigger.data) {
                    return NextResponse.json(
                        { message: 'Missing required field: trigger.data' },
                        { status: 400 }
                    );
                }
                const cronTrigger: string = trigger.data as string;
                await queue.upsertJobScheduler(jobId, { pattern: cronTrigger }, {
                    name: jobName,
                    data: requestData,
                });
                break;
            case "delay":
                if (!trigger.data) {
                    return NextResponse.json(
                        { message: 'Missing required field: trigger.data' },
                        { status: 400 }
                    );
                }
                const delayTrigger: Date = new Date(trigger.data as number);
                const delay = delayTrigger.getTime() - Date.now();
                if (delay <= 0) {
                    return NextResponse.json(
                        { message: 'Invalid trigger data' },
                        { status: 400 }
                    );
                }
                await queue.upsertJobScheduler(jobId, {
                    every: 86400000,
                    limit: 1,
                    startDate: delayTrigger,
                }, {
                    name: jobName,
                    data: requestData,
                });
                break;
            case "now":
                await queue.add(jobName, requestData, { jobId });
                break;
        }
        return NextResponse.json(
            { message: 'Job added successfully' },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: 'Error adding job', error },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
    const target = req.nextUrl.searchParams.get("target");
    if (!target || (target !== "prod" && target !== "dev")) {
        return NextResponse.json(
            { message: 'No target provided' },
            { status: 400 }
        );
    }
    const queues = await getQueues({ target });
    const { key: jobId, queueName, jobName, jobData, trigger }: { key: string, queueName: string, jobName: string, jobData: Record<string, unknown>, trigger: Trigger } = await req.json();

    if (!jobId || !queueName || !jobName || !jobData || !trigger) {
        return NextResponse.json(
            { message: 'Missing required fields: key, queueName, jobName, jobData and trigger' },
            { status: 400 }
        );
    }

    const queue = queues[queueName];
    const requestData = {
        queueName,
        jobName,
        jobData,
        trigger
    };


    if (!queue) {
        return NextResponse.json(
            { message: 'Invalid queue name' },
            { status: 400 }
        );
    }

    if (!trigger.type) {
        return NextResponse.json(
            { message: 'Missing required field: trigger.type' },
            { status: 400 }
        );
    }

    try {
        await queue.removeJobScheduler(jobId);
        switch (trigger.type) {
            case "repeat":
                if (!trigger.data) {
                    return NextResponse.json(
                        { message: 'Missing required field: trigger.data' },
                        { status: 400 }
                    );
                }
                const cronTrigger: string = trigger.data as string;
                await queue.upsertJobScheduler(jobId, { pattern: cronTrigger }, {
                    name: jobName,
                    data: requestData,
                });
                break;
            case "delay":
                if (!trigger.data) {
                    return NextResponse.json(
                        { message: 'Missing required field: trigger.data' },
                        { status: 400 }
                    );
                }
                const delayTrigger: Date = new Date(trigger.data as number);
                const delay = delayTrigger.getTime() - Date.now();
                if (delay <= 0) {
                    return NextResponse.json(
                        { message: 'Invalid trigger data' },
                        { status: 400 }
                    );
                }
                await queue.upsertJobScheduler(jobId, {
                    every: 86400000,
                    limit: 1,
                    startDate: delayTrigger,
                }, {
                    name: jobName,
                    data: requestData,
                });
                break;
            case "now":
                return NextResponse.json(
                    { message: 'Invalid trigger type' },
                    { status: 400 }
                )
        }
        return NextResponse.json(
            { message: 'Schedule updated successfully' },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: 'Error update schedule', error },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const target = req.nextUrl.searchParams.get("target");
    if (!target || (target !== "prod" && target !== "dev")) {
        return NextResponse.json(
            { message: 'No target provided' },
            { status: 400 }
        );
    }
    const queues = await getQueues({ target });
    const { queueName, jobSchedulerId }: { queueName: string, jobSchedulerId: string } = await req.json();

    if (!queueName || !jobSchedulerId) {
        return NextResponse.json(
            { message: 'Missing required fields: queueName and jobSchedulerId' },
            { status: 400 }
        );
    }

    const queue = queues[queueName];

    if (!queue) {
        return NextResponse.json(
            { message: 'Invalid queue name' },
            { status: 400 }
        );
    }

    try {
        await queue.removeJobScheduler(jobSchedulerId);
        return NextResponse.json(
            { message: 'Job removed successfully' },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: 'Error removing job', error },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    const target = req.nextUrl.searchParams.get("target");
    if (!target || (target !== "prod" && target !== "dev")) {
        return NextResponse.json(
            { message: 'No target provided' },
            { status: 400 }
        );
    }
    const queues = await getQueues({ target });

    const jobs: Record<string, Record<string, Job[] | RepeatableJob[]>> = {};
    for (const queueName in queues) {
        const queue = queues[queueName];
        if (queue) {
            const queueJobs = (await queue.getJobs()) || [];
            const queueJobSchedulers: RepeatableJob[] = [];

            for (const jobScheduler of (await queue.getJobSchedulers()) || []) {
                const key = jobScheduler.key
                const next = jobScheduler.next;
                if (next && new Date(next) < new Date()) {
                    await queue.removeJobScheduler(key);
                } else {
                    queueJobSchedulers.push(jobScheduler);
                }
            }

            jobs[queueName] = { jobs: queueJobs, schedulers: queueJobSchedulers };
        }
    }

    return NextResponse.json({ message: 'Jobs fetched successfully', jobs }, { status: 200 });
}