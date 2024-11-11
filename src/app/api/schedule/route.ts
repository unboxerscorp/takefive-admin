import { NextRequest, NextResponse } from 'next/server';
import queues from './queues';
import { Job, RepeatableJob } from 'bullmq';

export async function POST(req: NextRequest): Promise<NextResponse> {
    const { queueName, jobName, jobData, trigger }: { queueName: string, jobName: string, jobData: any, trigger: Trigger } = await req.json();

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

    const jobId = `${queueName}:${jobName}:${trigger.type}`;

    try {
        switch (trigger.type) {
            case "repeat":
                if (!trigger.data) {
                    return NextResponse.json(
                        { message: 'Missing required field: trigger.data' },
                        { status: 400 }
                    );
                }
                const cronTrigger: string = trigger.data;
                await queue.upsertJobScheduler(jobId, { pattern: cronTrigger }, {
                    name: jobName,
                    data: requestData,
                });
                break;
            case "once":
                if (!trigger.data) {
                    return NextResponse.json(
                        { message: 'Missing required field: trigger.data' },
                        { status: 400 }
                    );
                }
                const onceTrigger: Date = new Date(trigger.data);
                const delay = onceTrigger.getTime() - Date.now();
                if (delay <= 0) {
                    return NextResponse.json(
                        { message: 'Invalid trigger data' },
                        { status: 400 }
                    );
                }
                await queue.upsertJobScheduler(jobId, { every: delay, endDate: Date.now() + delay }, {
                    name: jobName,
                    data: jobData,
                });
                break;
            case "now":
                await queue.add(jobName, jobData, { jobId });
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

export async function DELETE(req: NextRequest): Promise<NextResponse> {
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

export async function GET(): Promise<NextResponse> {
    const jobs: Record<string, Record<string, Job[] | RepeatableJob[]>> = {};
    for (const queueName in queues) {
        const queue = queues[queueName];
        if (queue) {
            const queueJobs = (await queue.getJobs()) || [];
            const queueJobSchedulers = (await queue.getJobSchedulers()) || [];
            jobs[queueName] = { jobs: queueJobs, schedulers: queueJobSchedulers };
        }
    }

    return NextResponse.json({ message: 'Jobs fetched successfully', jobs }, { status: 200 });
}