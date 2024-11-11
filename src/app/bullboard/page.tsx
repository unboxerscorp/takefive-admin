import React from 'react';

const BullBoardPage = () => {
    return (
        <div style={{ width: '100%', height: '100vh' }}>
            <iframe
                src="https://scheduler.takefive.now/bull-board" // Bull Board 서버의 공개 URL로 변경
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Bull Board"
            />
        </div>
    );
};

export default BullBoardPage;