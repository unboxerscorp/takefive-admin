import admin from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// Firebase Admin 초기화 (이미 초기화된 경우 재초기화 방지)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}


export async function POST(req: NextRequest, res: NextResponse): Promise<NextResponse> {
    const { pushTokens, title, body } = await req.json();
    console.log({ pushTokens, title, body });

    if (!pushTokens || !title || !body) {
        return NextResponse.json({ message: 'Missing required fields: pushToken, title, and body' }, { status: 400 });
    }

    const message: admin.messaging.MulticastMessage = {
        tokens: pushTokens,
        notification: {
            title,
            body,
        },
        android: {
            priority: 'high',
        },
        apns: {
            payload: {
                aps: {
                    alert: {
                        title,
                        body,
                    },
                    sound: 'default',
                },
            },
        },
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log('Success:', response.successCount, 'Failure:', response.failureCount);
        return NextResponse.json({ message: 'Notification sent successfully', response });
    } catch (error) {
        console.error('Error sending notification:', error);
        return NextResponse.json({ message: 'Failed to send notification' }, { status: 500 });
    }
}