"use client"

import { Context } from '@/misc/context';
import PageTitle from '@/utils/page-title';
import { Avatar, Box } from '@mui/material';
import { DataGrid, GridColDef, useGridApiRef } from '@mui/x-data-grid';
import React from 'react';
import { flushSync } from 'react-dom';
import { io } from 'socket.io-client';
import { setTimeout } from 'timers';

function stringToHexColor(str: string | null): string {
    const toHexColor = () => {
        if (!str) {
            return '#FFFFFF';
        }
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = (hash & 0xFFFFFF).toString(16).padStart(6, '0');
        return `#${color}`;
    }
    return toHexColor() + "40";
}

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
                flattenObject({ obj: Object.fromEntries(Object.entries(value).map(([value_key, value]) => [`${key}_${value_key}`, value])), result });
            }
        } else {
            result[key] = `${value}`;
        }
    }
    return result;
}

export default function OnlineUsers() {
    const dataGridRef = useGridApiRef();
    const [isLoading, setIsLoading] = React.useState(false);
    const [columns, setColumns] = React.useState<GridColDef[]>([]);
    const [rows, setRows] = React.useState<Record<string, unknown>[]>([]);
    const prevRowsRef = React.useRef(rows);
    const [socketConnected, setSocketConnected] = React.useState(false);
    const { targetServer } = React.useContext(Context);

    React.useEffect(() => {
        const socketServerUrl = targetServer === "prod" ? "https://socket.takefive.now" : "https://dev.socket.takefive.now";

        const socket = io(socketServerUrl + "/admin", {
            auth: {
                token: "djsqkrtjwm!1932"
            },
            transports: ["websocket"]
        });

        socket.on("connect", () => {
            setIsLoading(true);
            setSocketConnected(true);
        });

        socket.on("system", (args) => {
            // console.log(args);
            if (!args) {
                return;
            }

            const { action, data } = args;
            switch (action) {
                case "sendCurrentUserData":
                    if (data) {
                        const { currentUserData } = data;
                        if (currentUserData) {
                            flushSync(() => {
                                setRows((rows) => {
                                    if (!areSetsEqual(currentUserData, rows)) {
                                        if (!data || data.length === 0) {
                                            return []
                                        }
                                        const newRows = currentUserData.map((item: Record<string, unknown>) => flattenObject({ obj: item })).map((item: Record<string, unknown> & { user_id: string }) => ({ ...item, id: +item.user_id }))
                                        // console.log(newRows)
                                        return newRows;
                                    }
                                    return rows
                                })
                            })
                        }
                    }
                    break;
                default:
                    break;
            }
        });

        socket.on("disconnect", () => {
            setIsLoading(false);
            setSocketConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, [targetServer]);

    React.useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
            const audioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

        const prevSet = new Set(prevRows.map(item => item.id));
        const currentSet = new Set(rows.map(item => item.id));

        const addedItems = rows.filter(item => !prevSet.has(item.id));     // 새로 추가된 요소들
        const removedItems = prevRows.filter(item => !currentSet.has(item.id)); // 삭제된 요소들

        const isIncreased = addedItems.length > 0 && !addedItems.every(item => item.isAdmin);
        const isDecreased = removedItems.length > 0 && !removedItems.every(item => item.isAdmin);

        if (isIncreased && isDecreased) {
            addSound.play().catch(() => { });
        } else if (isIncreased) {
            addSound.play().catch(() => { });
        } else if (isDecreased) {
            removeSound.play().catch(() => { });
        }

        prevRowsRef.current = rows;

        if (rows.length > 0) {
            setColumns([
                { field: "id", headerName: "ID", align: "center", headerAlign: "center", width: 1 },
                { field: "user_preference_nickname", headerName: "Name", align: "center", headerAlign: "center", width: 1 },
                { field: "user_isAdmin", headerName: "Admin", align: "center", headerAlign: "center", renderCell: (params) => <span style={{ backgroundColor: params.value === "false" ? "gold" : "white", padding: "0.5rem" }} >{params.value}</span>, width: 1 },
                { field: "userStatus_queueStatus", headerName: "Queue", align: "center", headerAlign: "center", width: 1 },
                { field: "userStatus_sessionStatus", headerName: "Session", align: "center", headerAlign: "center", renderCell: (params) => <span style={{ color: params.row.user_isAdmin === "false" ? params.value === "waiting" ? "red" : params.value === "idle" ? "orange" : "black" : "gray" }} >{params.value}</span>, width: 1 },
                {
                    field: "user_preference_profileImage", headerName: "Profile", align: "center", headerAlign: "center", renderCell: (params) =>
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}>{params.value && <Avatar style={{ width: 40, height: 40 }} src={params.value} />}</Box>, width: 1
                },
                { field: "user_preference_regionCode", headerName: "Region", align: "center", headerAlign: "center", width: 1 },
                { field: "user_preference_languageCode", headerName: "Language", align: "center", headerAlign: "center", width: 1 },
                { field: "user_preference_level", headerName: "Level", align: "center", headerAlign: "center", width: 1 },
                { field: "user_preference_gender", headerName: "Gender", align: "center", headerAlign: "center", width: 1 },
                {
                    field: "user_lastMatchedWith", headerName: "Last Match", align: "center", headerAlign: "center", valueGetter: (value) => JSON.parse(value).join(" "), renderCell: (params) => <span style={{ padding: "0.5rem" }} >[{params.value}]</span>, width: 1
                },
                { field: "userStatus_sessionInfo_batchId", headerName: "Batch", align: "center", headerAlign: "center", renderCell: (params) => <span style={{ padding: "0.5rem", backgroundColor: stringToHexColor(params.value) }} >{params.value ? params.value : "-"}</span>, width: 1 },
                { field: "userStatus_sessionInfo_sessionName", headerName: "Session", align: "center", headerAlign: "center", renderCell: (params) => <span style={{ padding: "0.5rem", backgroundColor: stringToHexColor(params.value) }} >{params.value ? params.value : "-"}</span>, width: 1 },
                { field: "userStatus_sessionInfo_sessionInfo_timetable_startTime", headerName: "Session start at", align: "center", headerAlign: "center", valueFormatter: (value) => value ? new Date(value).toLocaleString("ko-KR") : "-", width: 1 },
                { field: "userStatus_sessionInfo_sessionInfo_timetable_endTime", headerName: "Session end at", align: "center", headerAlign: "center", valueFormatter: (value) => value ? new Date(value).toLocaleString("ko-KR") : "-", width: 1 },
                { field: "user_createdAt", headerName: "Created at", align: "center", headerAlign: "center", valueFormatter: (value) => value ? new Date(value).toLocaleString("ko-KR") : "-", width: 1 },
            ]);

            let outerTimeoutId: NodeJS.Timeout | null = null;
            let innerTimeoutId: NodeJS.Timeout | null = null;

            outerTimeoutId = setTimeout(() => {
                innerTimeoutId = setTimeout(() => {
                    if (dataGridRef?.current) {
                        dataGridRef.current.autosizeColumns({
                            // includeHeaders: true,
                            includeOutliers: true,
                        }).finally(() => {
                            setIsLoading(false);
                        });
                        dataGridRef.current.sortColumn("id", "asc");
                    } else {
                        setIsLoading(false);
                    }
                }, 200);
            }, 1000);

            return () => {
                if (outerTimeoutId) clearTimeout(outerTimeoutId);
                if (innerTimeoutId) clearTimeout(innerTimeoutId);
            };

        } else {
            setIsLoading(false);
            setColumns([]);
        }
    }, [rows, dataGridRef]);

    return (
        <Box sx={{ background: "white", display: "flex", flexDirection: "column", rowGap: 5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <PageTitle title="Online Users" />
                <span style={{ display: "flex", alignItems: "center", columnGap: "0.2rem" }}>
                    {socketConnected ? <span style={{ color: "green" }}>Connected</span> : <span style={{ color: "red" }}>Disconnected</span>}
                    <StatusDot socketConnected={socketConnected} />
                </span>
            </Box>
            <Box key={`${rows.length}`} sx={{
                border: "10px solid #cccccc33",
                borderRadius: "8px",
                height: "100%",
                boxSizing: "border-box",
                overflow: "auto"
            }}>
                <DataGrid
                    apiRef={dataGridRef}
                    rows={rows}
                    columns={columns}
                    sx={{
                        border: 0
                    }}
                    loading={isLoading}
                    sortModel={[
                        { field: "id", sort: "asc" }
                    ]}
                />
            </Box>
        </Box>
    );
}

const StatusDot = ({ socketConnected }: { socketConnected: boolean }) => {
    return (
        <span style={{
            animation: "blinker 2s linear infinite",
            width: "0.7rem",
            height: "0.7rem",
            display: "inline-block",
            backgroundColor: socketConnected ? "green" : "lightgrey",
            borderRadius: "100%",
            marginLeft: "0.5rem",
        }}>
            <style>
                {`
                    @keyframes blinker {
                        50% {
                            opacity: 0.3;
                        }
                    }
                `}
            </style>
        </span>
    );
}