"use client"

import { Box, Button, Card } from '@mui/material';
import { DataGrid, GridColDef, useGridApiRef } from '@mui/x-data-grid';
import React from 'react';
import ReactDOM from 'react-dom';
import { setTimeout } from 'timers';

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export default function PushNotification() {
    const dataGridRef = useGridApiRef();
    const [columns, setColumns] = React.useState<GridColDef[]>([]);
    const [rows, setRows] = React.useState<Record<string, any>[]>([]);
    const [updatedAt, setUpdatedAt] = React.useState<number | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const titleRef = React.useRef<HTMLInputElement>(null);
    const messageRef = React.useRef<HTMLTextAreaElement>(null);

    const fetchData = React.useCallback(() => {
        setIsLoading(true);
        fetch(`/api/redis?${new URLSearchParams({ key: "preload_data:push_tokens" }).toString()}`, {
            method: "GET"
        })
            .then((res) => res.json())
            .catch((err) => {
                console.error(err);
                return { data: {} }
            })
            .then(({ data }) => {
                const values = Object.values(data)
                const value: { data: [{ user_id: number, token: string }], updated_at: number } | undefined = values.shift() as any;
                return value;
            })
            .then((value) => {
                setIsLoading(false);
                if (!value) {
                    return;
                }
                const { data: pushTokens, updated_at: updatedAt } = value;
                setUpdatedAt(updatedAt);
                ReactDOM.flushSync(() => {
                    setColumns([
                        { field: "user_id", flex: 1, headerName: "User ID", align: "center", headerAlign: "center" },
                        { field: "token", headerName: "Push Token", align: "center", headerAlign: "center" }
                    ]);
                    if (pushTokens !== rows) {
                        setRows(pushTokens);
                    }
                })
            }).then(() => sleep(0)).then(() => {
                dataGridRef.current.autosizeColumns({
                    includeHeaders: true,
                    includeOutliers: true,
                })
            });
    }, [dataGridRef, rows]);

    React.useEffect(() => {
        // fetchData();
    }, [fetchData]);


    const sendPushNotificationToSelected = async ({
        title, message, dryRun,
    }: {
        title: string,
        message: string
        dryRun: boolean
    }) => {
        const userIds: number[] = [];

        dataGridRef.current.getSelectedRows().forEach((row: any) => {
            const { user_id } = row;
            userIds.push(user_id);
        });

        if (userIds.length === 0) {
            console.error("No users selected");
            return;
        }

        return await fetch("https://api.takefive.now/api/admin/push-notification", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title,
                body: message,
                dryRun,
                userIds,
            })
        });
    }

    const sendPushNotificationToAll = async ({
        title, message, dryRun,
    }: {
        title: string,
        message: string
        dryRun: boolean
    }) => {
        return await fetch("https://api.takefive.now/api/admin/push-notification-all", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title,
                body: message,
                dryRun,
            })
        });
    }

    const sendPushNotificationToAdmin = async ({
        title, message, dryRun,
    }: {
        title: string,
        message: string
        dryRun: boolean
    }) => {
        return await fetch("https://api.takefive.now/api/admin/push-notification", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            mode: "no-cors",
            body: JSON.stringify({
                title,
                body: message,
                dryRun,
                isAdmin: true,
            })
        });
    }

    const sendPushNotification = async ({ pushType, dryRun }: {
        pushType: "all" | "selected" | "admin",
        dryRun: boolean,
    }) => {
        const title = titleRef.current?.value;
        const message = messageRef.current?.value;

        if (!title) {
            console.error("Title is required");
            return;
        }
        if (!message) {
            console.error("Message is required");
            return;
        }

        let response: Response | undefined;

        switch (pushType) {
            case "all":
                response = await sendPushNotificationToAll({ title, message, dryRun });
                break;
            case "selected":
                response = await sendPushNotificationToSelected({ title, message, dryRun });
                break;
            case "admin":
                response = await sendPushNotificationToAdmin({ title, message, dryRun });
                break;
            default:
                break;
        }

        if (response) {
            const data = await response.json();
            if (response.status === 200) {
                console.log(data);
            } else {
                console.error(data);
            }
        }
    }

    const callLambda = async () => {
        const res = await fetch('/api/call-lambda', {
            method: 'POST',
        });
        const data = await res.json();
        if (res.status === 200) {
            console.log(data);
            fetchData();
        } else {
            console.error(data);
        }
    };

    return (
        <Box sx={{ height: '100%', width: '100%', background: "white", display: "flex", flexDirection: "column", rowGap: 5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ textAlign: "center", fontWeight: "bold", fontSize: "1.5rem", color: "black" }}>Push Notification</h1>
                <Box sx={{ display: "flex", alignItems: "center", columnGap: 2 }}>
                    <span style={{ color: "black", fontWeight: "bold" }} suppressHydrationWarning>최근 DB 업데이트 시간: {new Date(updatedAt ?? 0).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} (KST)</span>
                    <Button onClick={callLambda} sx={{ backgroundColor: "red", color: "white", fontWeight: "bold", "&.Mui-disabled": { backgroundColor: "lightgrey" } }} disabled variant="contained">DB Refresh (필요 시*)</Button>
                </Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", flexGrow: 1, overflow: "hidden", flexDirection: "row", columnGap: 2 }}>
                <Box
                    flex={5}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexDirection="column"
                    rowGap={5}
                    px={10}
                    sx={{
                        border: "10px solid #cccccc33",
                        borderRadius: "8px",
                        padding: "32px",
                        width: "100%",
                        height: "100%",
                        boxSizing: "border-box",
                        overflow: "auto"
                    }}
                >
                    <Card sx={{ background: "linear-gradient(45deg, #FFA611 00%, #F6820D 50%, #FFCB2B 100%)", display: "flex", flexDirection: "column", rowGap: 3, padding: 5, width: "100%", height: "100%", textAlign: "center" }} elevation={3}>
                        <span style={{ color: "white", fontWeight: "bold", fontSize: "1.5rem" }}>알림 내용을 입력해주세요</span>
                        <input
                            ref={titleRef}
                            id="outlined-required"
                            placeholder='Title'
                            style={{
                                backgroundColor: "white",
                                borderRadius: "4px",
                                padding: "8px",
                                boxSizing: "border-box"
                            }}
                        />
                        <textarea
                            ref={messageRef}
                            id="outlined-required"
                            placeholder="Message"
                            style={{
                                width: "100%", height: "100%", resize: "none", border: "1px solid #ccc", borderRadius: "4px", padding: "8px", boxSizing: "border-box"
                            }}
                        />
                    </Card>
                    <Box sx={{ display: "flex", flexDirection: "column", rowGap: 2, width: "100%" }}>
                        <Box sx={{ width: "100%", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
                            <Button variant="contained" sx={{ backgroundColor: "skyblue" }} onClick={() => sendPushNotification({ pushType: "all", dryRun: true })}>Send To All<br />(Preview)</Button>
                            <Button variant="contained" sx={{ backgroundColor: "skyblue" }} onClick={() => sendPushNotification({ pushType: "admin", dryRun: true })}>Send To Admin<br />(Preview)</Button>
                            <Button variant="contained" sx={{ backgroundColor: "skyblue" }} disabled onClick={() => sendPushNotification({ pushType: "selected", dryRun: true })}>Send To Selection<br />(Preview)</Button>
                        </Box>
                        <Box sx={{ width: "100%", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
                            <Button variant="contained" sx={{ backgroundColor: "red" }} onClick={() => sendPushNotification({ pushType: "all", dryRun: false })}>Send To All*</Button>
                            <Button variant="contained" sx={{ backgroundColor: "red" }} onClick={() => sendPushNotification({ pushType: "admin", dryRun: false })}>Send To Admin*</Button>
                            <Button variant="contained" sx={{ backgroundColor: "red" }} disabled onClick={() => sendPushNotification({ pushType: "selected", dryRun: false })}>Send To Selection*</Button>
                        </Box>
                    </Box>
                </Box>
                <Box
                    flex={4}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                        border: "10px solid #cccccc33",
                        borderRadius: "8px",
                        width: "100%",
                        height: "100%",
                        boxSizing: "border-box",
                        overflowY: "auto"
                    }}
                >
                    <DataGrid
                        apiRef={dataGridRef}
                        rows={rows}
                        columns={columns}
                        sx={{ border: 0 }}
                        getRowId={(row) => row.user_id}
                        checkboxSelection
                        sortModel={[{ field: "user_id", sort: "asc" }]}
                        initialState={{
                            columns: {
                                columnVisibilityModel: {
                                    token: false
                                }
                            }
                        }}
                        loading={isLoading}
                    />
                </Box>
            </Box>
        </Box>
    );
}

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}