import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const { pushTokens, title, body } = await req.json();

        if (!pushTokens || !title || !body) {
            return NextResponse.json(
                { message: 'Missing required fields: pushTokens, title, and body' },
                { status: 400 }
            );
        }

        const message: admin.messaging.MulticastMessage = {
            tokens: pushTokens,
            notification: { title, body },
            android: { priority: 'high' },
            apns: {
                payload: {
                    aps: {
                        alert: { title, body },
                        sound: 'default',
                    },
                },
            },
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        return NextResponse.json({
            message: 'Notifications sent successfully',
            successCount: response.successCount,
            failureCount: response.failureCount,
        });
    } catch (error) {
        console.error('Error sending notifications:', error);
        return NextResponse.json({ message: 'Failed to send notifications' }, { status: 500 });
    }
}