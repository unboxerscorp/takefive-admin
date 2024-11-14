import { NextResponse } from 'next/server';

export async function GET() {
    const bullBoardUrl = 'https://scheduler.takefive.now/bull-board'

    try {
        const response = await fetch(bullBoardUrl);
        const html = await response.text();

        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html' },
        });
    } catch (error) {
        return new NextResponse(JSON.stringify({ message: 'Failed to load Bull Board', error }), { status: 500, });
    }
}