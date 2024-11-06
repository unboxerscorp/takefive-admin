"use client"

import { Avatar, Box, Button, CircularProgress, FormControlLabel, Switch } from '@mui/material';
import { DataGrid, GridColDef, useGridApiRef } from '@mui/x-data-grid';
import React from 'react';
import ReactDOM from 'react-dom';
import { setTimeout } from 'timers';

function flattenObject({ obj, result = {} }: { obj: Record<string, any>, result?: Record<string, any> }) {
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                result[key] = JSON.stringify(value);
            } else {
                flattenObject({ obj: value, result });
            }
        } else {
            result[key] = `${value}`;
        }
    }
    return result;
}

export default function OnlineUsers() {
    const apiRef = useGridApiRef();
    // const [isLoading, setIsLoading] = React.useState(false);
    const [columns, setColumns] = React.useState<GridColDef[]>([]);
    const [rows, setRows] = React.useState<Record<string, any>[]>([]);
    const prevRowsRef = React.useRef(rows);

    const [isAutoRefreshActive, setIsAutoRefreshActive] = React.useState(false);
    const [countDown, setCountDown] = React.useState<number | null>(null);
    const [isVisible, setIsVisible] = React.useState(false);

    const fetchData = React.useCallback(() => {
        fetch(`/api/redis?${new URLSearchParams({ key: "user:*:user_data" }).toString()}`, { method: "GET" }).then(res => res.json()).catch(err => { console.error(err); return { data: {} } }).then(({ data }) => Object.values(data).map((user: any) => flattenObject({ obj: user }))).then((data) => {
            console.log(data);
            ReactDOM.flushSync(() => {
                setCountDown(3);
                // setIsLoading(false);
                if (!data || data.length === 0) {
                    return;
                }
                setColumns(Object.keys(data[0]).map((key) => ({ field: key, headerName: key, renderCell: key === "profileImage" ? (params) => <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}><Avatar style={{ width: 40, height: 40 }} src={params.value} /></Box> : undefined, align: "center", headerAlign: "center" })));
                setRows(data);
            });
        }).then(() => sleep(0)).then(() => {
            if (!isAutoRefreshActive) {
                apiRef.current.autosizeColumns({
                    includeHeaders: true,
                    includeOutliers: true,
                })
            }
        }
        );
    }, [apiRef]);

    React.useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
            const audioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (audioContext) {
                const context = new audioContext();
            } else {
                console.error('AudioContext is not supported in this browser.');
            }
        }).catch(e => {
            console.error(`Audio permissions denied: ${e}`);
        });
    }, []);

    React.useEffect(() => {
        if (apiRef.current && isAutoRefreshActive) {
            const interval = setInterval(() => {
                apiRef.current.autosizeColumns({
                    includeHeaders: true,
                    includeOutliers: true,
                })
            }, 30000)

            return () => {
                clearInterval(interval);
            }
        }
    }, [apiRef.current, isAutoRefreshActive]);

    React.useEffect(() => {
        const addSound = new Audio('/add-sound.mp3');      // 추가 효과음
        const removeSound = new Audio('/remove-sound.mp3'); // 제거 효과음

        const prevRows = prevRowsRef.current;

        const prevSet = new Set(prevRows.map(item => item.id));
        const currentSet = new Set(rows.map(item => item.id));

        const addedItems = rows.map(item => item.id).filter(item => !prevSet.has(item));     // 새로 추가된 요소들
        const removedItems = prevRows.map(item => item.id).filter(item => !currentSet.has(item)); // 삭제된 요소들

        if (addedItems.length > 0 && removedItems.length > 0) {
            addSound.play();
        } else if (addedItems.length > 0) {
            addSound.play();
        } else if (removedItems.length > 0) {
            removeSound.play();
        }

        prevRowsRef.current = rows;
    }, [rows]);

    React.useEffect(() => {
        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    React.useEffect(() => {
        if (!isVisible) {
            setIsAutoRefreshActive(false);
        }
    }, [isVisible])

    React.useEffect(() => {
        if (countDown !== null) {
            if (countDown > 0) {
                setTimeout(() => setCountDown(countDown - 1), 1000);
                return;
            }
        }
        if (isAutoRefreshActive) {
            fetchData();
        } else {
            setCountDown(null);
        }
    }, [countDown, isAutoRefreshActive])

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <Box sx={{ height: '100%', width: '100%', background: "white", display: "flex", flexDirection: "column", rowGap: 5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ textAlign: "center", fontWeight: "bold", fontSize: "1.5rem", color: "black" }}>Online Users</h1>
                <Box sx={{ display: "flex", alignItems: "center", columnGap: 5 }}>
                    <FormControlLabel style={{ margin: 0 }} slotProps={{ typography: { color: "black", fontWeight: "bold", fontSize: "0.8rem" } }} control={<Switch checked={isAutoRefreshActive} onChange={(e) => setIsAutoRefreshActive(e.target.checked)} />} label="자동 새로고침" />
                    <Box sx={{ display: "flex", alignItems: "center", columnGap: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", columnGap: 1, visibility: countDown !== null ? "visible" : "hidden" }}>
                            <span style={{ color: "lightgrey" }}>{countDown === null ? "00" : countDown > 9 ? countDown : `0${countDown}`}초</span>
                            <CircularProgress color="inherit" size={20} />
                        </Box>
                        <Button onClick={fetchData} sx={{ width: "100px", backgroundColor: "black", color: "white", fontWeight: "bold", "&.Mui-disabled": { backgroundColor: "lightgrey" } }} disabled={countDown !== null || isAutoRefreshActive} variant="outlined">Refresh</Button>
                    </Box>
                </Box>
            </Box>
            <DataGrid
                apiRef={apiRef}
                rows={rows}
                columns={columns}
                sx={{ border: 0 }}
            // loading={isLoading}
            />
        </Box>
    );
}

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}