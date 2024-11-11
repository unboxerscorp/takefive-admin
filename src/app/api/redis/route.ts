import { getRedisClient } from '@/misc/redis';

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

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (!key) {
        return Response.json({ error: "No key provided" }, { status: 400 });
    }
    const redis = await getRedisClient();
    const body = await request.json();
    await redis.set(key, JSON.stringify(body));
    return Response.json({ success: true })
}