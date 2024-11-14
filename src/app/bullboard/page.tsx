"use client"

import { Context } from '@/misc/context';
import React from 'react';

const BullBoardPage = () => {
    const { targetServer } = React.useContext(Context)

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <iframe
                src={targetServer === "prod" ? "https://scheduler.takefive.now/bull-board" : "https://dev.scheduler.takefive.now/bull-board"}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Bull Board"
            />
        </div>
    );
};

export default BullBoardPage;