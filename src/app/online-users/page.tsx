"use client"

import { Avatar, Box } from '@mui/material';
import { DataGrid, GridColDef, useGridApiRef } from '@mui/x-data-grid';
import React from 'react';
import { io } from 'socket.io-client';
import { setTimeout } from 'timers';

function areSetsEqual(set1: Record<string, unknown>[], set2: Record<string, unknown>[]) {
    if (set1.length !== set2.length) {
        return false;
    }

    return [...set1.map(item => item.id)].every(item => set2.map(item => item.id).includes(item));
}

function flattenObject({ obj, result = {} }: { obj: Record<string, unknown> | object, result?: Record<string, unknown> }) {
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

const socketServerUrl = "https://socket.takefive.now"

export default function OnlineUsers() {
    const apiRef = useGridApiRef();
    const [isLoading, setIsLoading] = React.useState(false);
    const [columns, setColumns] = React.useState<GridColDef[]>([]);
    const [rows, setRows] = React.useState<Record<string, unknown>[]>([]);
    const prevRowsRef = React.useRef(rows);

    React.useEffect(() => {
        const socket = io(socketServerUrl + "/admin", {
            auth: {
                token: "djsqkrtjwm!1932"
            }
        });

        socket.on("system", (args) => {
            console.log(args);
            if (!args) {
                return;
            }

            const { action, data } = args;
            switch (action) {
                case "sendCurrentUserData":
                    if (data) {
                        const { currentUserData } = data;
                        if (currentUserData) {
                            setRows((rows) => {
                                if (!areSetsEqual(currentUserData, rows)) {
                                    if (!data || data.length === 0) {
                                        return []
                                    }
                                    return currentUserData.map((item: Record<string, unknown>) => flattenObject({ obj: item }));
                                }
                                return rows
                            })
                        }
                    }
                    break;
                default:
                    break;
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    React.useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
            const audioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (audioContext) {
                new audioContext();
            } else {
                console.error('AudioContext is not supported in this browser.');
            }
        }).catch(e => {
            console.error(`Audio permissions denied: ${e}`);
        });
    }, []);

    React.useEffect(() => {
        const addSound = new Audio('/add-sound.mp3');      // 추가 효과음
        const removeSound = new Audio('/remove-sound.mp3'); // 제거 효과음

        const prevRows = prevRowsRef.current;

        const prevSet = new Set(prevRows);
        const currentSet = new Set(rows);

        const addedItems = rows.filter(item => !prevSet.has(item));     // 새로 추가된 요소들
        const removedItems = prevRows.filter(item => !currentSet.has(item)); // 삭제된 요소들

        const isIncreased = addedItems.length > 0 && !addedItems.every(item => item.isAdmin);
        const isDecreased = removedItems.length > 0 && !removedItems.every(item => item.isAdmin);

        if (isIncreased && isDecreased) {
            addSound.play();
        } else if (isIncreased) {
            addSound.play();
        } else if (isDecreased) {
            removeSound.play();
        }

        prevRowsRef.current = rows;

        let outerTimeoutId: NodeJS.Timeout | null = null;
        let innerTimeoutId: NodeJS.Timeout | null = null;

        outerTimeoutId = setTimeout(() => {
            innerTimeoutId = setTimeout(() => {
                if (apiRef?.current) {
                    apiRef.current.autosizeColumns({
                        // includeHeaders: true,
                        includeOutliers: true,
                    }).finally(() => {
                        setIsLoading(false);
                    });
                } else {
                    setIsLoading(false);
                }
            }, 200);
        }, 1000);

        return () => {
            if (outerTimeoutId) clearTimeout(outerTimeoutId);
            if (innerTimeoutId) clearTimeout(innerTimeoutId);
        };
    }, [rows, apiRef]);

    React.useEffect(() => {
        setColumns([
            { field: "id", headerName: "ID", align: "center", headerAlign: "center" },
            { field: "nickname", headerName: "Name", align: "center", headerAlign: "center" },
            { field: "isAdmin", headerName: "Admin", align: "center", headerAlign: "center" },
            { field: "isBackup", headerName: "Backup", align: "center", headerAlign: "center" },
            { field: "queueStatus", headerName: "Queue", align: "center", headerAlign: "center" },
            { field: "sessionStatus", headerName: "Session", align: "center", headerAlign: "center" },
            {
                field: "profileImage", headerName: "Profile", align: "center", headerAlign: "center", renderCell: (params) =>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}><Avatar style={{ width: 40, height: 40 }} src={params.value} /></Box>
            },
            { field: "regionCode", headerName: "Region", align: "center", headerAlign: "center" },
            { field: "languageCode", headerName: "Language", align: "center", headerAlign: "center" },
            { field: "level", headerName: "Level", align: "center", headerAlign: "center" },
            {
                field: "lastMatchedWith", headerName: "Last Match", align: "center", headerAlign: "center", valueGetter: (value) => JSON.parse(value).join(" "), renderCell: (params) => <span style={{ padding: "0.5rem 0" }} >[{params.value}]</span>
            },
            { field: "createdAt", headerName: "Created at", align: "center", headerAlign: "center" },
        ]);
    }, []);

    return (
        <Box sx={{ height: '100%', width: '100%', background: "white", display: "flex", flexDirection: "column", rowGap: 5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ textAlign: "center", fontWeight: "bold", fontSize: "1.5rem", color: "black" }}>Online Users</h1>
            </Box>
            <Box sx={{
                border: "10px solid #cccccc33",
                borderRadius: "8px",
                height: "100%",
                boxSizing: "border-box",
                overflow: "auto"
            }}>
                <DataGrid
                    apiRef={apiRef}
                    rows={rows}
                    columns={columns}
                    sx={{ border: 0 }}
                    loading={isLoading}
                    sortModel={[
                        { field: "id", sort: "asc" }
                    ]}
                />
            </Box>
        </Box>
    );
}