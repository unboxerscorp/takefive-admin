import aws4 from 'aws4';
import https from 'https';
import { NextResponse } from 'next/server';

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;

export async function POST(): Promise<NextResponse> {
    const url = new URL('https://qyaddtk7jzrbwqlb3e3vrd2hr40vfymm.lambda-url.ap-northeast-2.on.aws/');

    const body = JSON.stringify({
        redisKey: "push_tokens",
        query: "SELECT user_push_tokens.user_id, user_push_tokens.token FROM user_push_tokens JOIN users ON user_push_tokens.user_id = users.id WHERE user_push_tokens.token IS NOT null AND users.status = 'active' AND user_push_tokens.status = 'active'"
    });

    const opts = {
        host: url.host,
        path: url.pathname,
        service: 'lambda',
        region: AWS_REGION,
        method: 'POST',
        body,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // AWS IAM 서명 추가
    aws4.sign(opts, {
        accessKeyId: AWS_ACCESS_KEY_ID!,
        secretAccessKey: AWS_SECRET_ACCESS_KEY!,
    });

    return new Promise((resolve) => {
        const request = https.request(opts, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    if (response.statusCode === 200) {
                        resolve(NextResponse.json(jsonData));
                    } else {
                        resolve(NextResponse.json({ error: 'Failed to call Lambda', ...jsonData }, { status: 500 }));
                    }
                } catch (error) {
                    console.error('Error parsing response JSON:', error);
                    resolve(NextResponse.json({ error: 'Failed to parse response' }, { status: 500 }));
                }
            });
        });

        request.on('error', (error) => {
            console.error('Error calling Lambda:', error);
            resolve(NextResponse.json({ error: 'Failed to call Lambda' }, { status: 500 }));
        });

        request.write(body);
        request.end();
    });
}