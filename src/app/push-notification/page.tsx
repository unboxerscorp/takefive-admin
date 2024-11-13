"use client"

import { Box, Button, Card, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { DataGrid, GridColDef, useGridApiRef } from '@mui/x-data-grid';
import React from 'react';
import ReactDOM from 'react-dom';
import { setTimeout } from 'timers';
import { enqueueSnackbar, SnackbarProvider, useSnackbar } from "notistack";

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

    const [title, setTitle] = React.useState<string>("");
    const [message, setMessage] = React.useState<string>("");
    const [target, setTarget] = React.useState<string>("");
    const [triggerType, setTriggerType] = React.useState<"repeat" | "once" | "now" | "">("");
    const [cronPattern, setCronPattern] = React.useState<string>("");
    const [sendAble, setSendAble] = React.useState<boolean>(false);
    const { enqueueSnackbar } = useSnackbar();

    // const fetchData = React.useCallback(() => {
    //     setIsLoading(true);
    //     fetch(`/api/redis?${new URLSearchParams({ key: "preload_data:push_tokens" }).toString()}`, {
    //         method: "GET"
    //     })
    //         .then((res) => res.json())
    //         .catch((err) => {
    //             console.error(err);
    //             return { data: {} }
    //         })
    //         .then(({ data }) => {
    //             const values = Object.values(data)
    //             const value: { data: [{ user_id: number, token: string }], updated_at: number } | undefined = values.shift() as any;
    //             return value;
    //         })
    //         .then((value) => {
    //             setIsLoading(false);
    //             if (!value) {
    //                 return;
    //             }
    //             const { data: pushTokens, updated_at: updatedAt } = value;
    //             setUpdatedAt(updatedAt);
    //             ReactDOM.flushSync(() => {
    //                 setColumns([
    //                     { field: "user_id", flex: 1, headerName: "User ID", align: "center", headerAlign: "center" },
    //                     { field: "token", headerName: "Push Token", align: "center", headerAlign: "center" }
    //                 ]);
    //                 if (pushTokens !== rows) {
    //                     setRows(pushTokens);
    //                 }
    //             })
    //         }).then(() => sleep(0)).then(() => {
    //             dataGridRef.current.autosizeColumns({
    //                 includeHeaders: true,
    //                 includeOutliers: true,
    //             })
    //         });
    // }, [dataGridRef, rows]);

    // React.useEffect(() => {
    //     // fetchData();
    // }, [fetchData]);

    async function sendNotificationJob() {
        const queueName = "notificationQueue";
        const jobName = target === "all" ? "sendPushNotificationToAll" : target === "selected" ? "sendPushNotificationToSelected" : "sendPushNotificationToAdmin";

        const jobData = {
            title,
            message,
            dryRun: false,
        };

        setIsLoading(true);
        await fetch("/api/schedule", {
            method: "POST",
            body: JSON.stringify(
                triggerType === "repeat" ? {
                    queueName,
                    jobName,
                    jobData,
                    trigger: {
                        type: "repeat",
                        data: cronPattern
                    }
                } : {
                    queueName,
                    jobName,
                    jobData,
                    trigger: {
                        type: "now"
                    }
                })
        }).then(async (response) => {
            if (response.ok) {
                resetInput();
                // await getJobs();
            }
        }).finally(() => {
            setIsLoading(false);
        });
    }

    const resetInput = () => {
        setTarget("");
        setTriggerType("");
        setCronPattern("");
        setTitle("");
        setMessage("");
        setSendAble(false);
    }

    const sendPushNotificationPrecheckToSelected = async ({
        title, message,
    }: {
        title: string,
        message: string

    }) => {
        const userIds: number[] = [];

        dataGridRef.current.getSelectedRows().forEach((row: any) => {
            const { user_id } = row;
            userIds.push(user_id);
        });

        if (userIds.length === 0) {
            enqueueSnackbar("Please select at least one user", { variant: "warning" });
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
                userIds,
                dryRun: true,
            })
        });
    }

    const sendPushNotificationPrecheckToAll = async ({
        title, message,
    }: {
        title: string,
        message: string
    }) => {
        return await fetch("https://api.takefive.now/api/admin/push-notification-all", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title,
                body: message,
                dryRun: true
            })
        });
    }

    const sendPushNotificationPrecheckToAdmin = async ({
        title, message,
    }: {
        title: string,
        message: string
    }) => {
        return await fetch("https://api.takefive.now/api/admin/push-notification", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title,
                body: message,
                dryRun: true,
                isAdmin: true,
            })
        });
    }

    const sendPushNotification = async ({ precheck }: {
        precheck: boolean,
    }) => {
        if (!target) {
            enqueueSnackbar("Target is required", {
                variant: "error",
                autoHideDuration: 10000,
                anchorOrigin: { vertical: "bottom", horizontal: "right" }
            })
            return;
        }

        if (!triggerType) {
            enqueueSnackbar("Trigger type is required", {
                variant: "error",
                autoHideDuration: 10000,
                anchorOrigin: { vertical: "bottom", horizontal: "right" }
            })
            return;
        }

        if (triggerType === "repeat" && !cronPattern) {
            enqueueSnackbar("Cron pattern is required", {
                variant: "error",
                autoHideDuration: 10000,
                anchorOrigin: { vertical: "bottom", horizontal: "right" }
            })
            return;
        }

        if (!title) {
            enqueueSnackbar("Title is required", {
                variant: "error",
                autoHideDuration: 10000,
                anchorOrigin: { vertical: "bottom", horizontal: "right" }
            })
            return;
        }
        if (!message) {
            enqueueSnackbar("Message is required", {
                variant: "error",
                autoHideDuration: 10000,
                anchorOrigin: { vertical: "bottom", horizontal: "right" }
            })
            return;
        }

        let response: Response | undefined;

        if (precheck) {
            switch (target) {
                case "all":
                    response = await sendPushNotificationPrecheckToAll({ title, message });
                    break;
                case "selected":
                    response = await sendPushNotificationPrecheckToSelected({ title, message });
                    break;
                case "admin":
                    response = await sendPushNotificationPrecheckToAdmin({ title, message });
                    break;
                default:
                    break;
            }
        } else {
            switch (target) {
                case "all":
                case "selected":
                case "admin":
                    sendNotificationJob();
                    break;
                default:
                    break;
            }
        }

        if (response) {
            const data = await response.json();
            if (response.status === 200) {
                enqueueSnackbar(JSON.stringify(data), {
                    variant: "success",
                    autoHideDuration: 10000,
                    anchorOrigin: { vertical: "bottom", horizontal: "right" }
                });
                setSendAble(true);
            } else {
                enqueueSnackbar(JSON.stringify(data), {
                    variant: "error",
                    autoHideDuration: 10000,
                    anchorOrigin: { vertical: "bottom", horizontal: "right" }
                });
            }
        }
    }

    // const callLambda = async () => {
    //     const res = await fetch('/api/call-lambda', {
    //         method: 'POST',
    //     });
    //     const data = await res.json();
    //     if (res.status === 200) {
    //         console.log(data);
    //         fetchData();
    //     } else {
    //         console.error(data);
    //     }
    // };

    return (
        <Box sx={{ height: '100%', width: '100%', background: "white", display: "flex", flexDirection: "column", rowGap: 5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ textAlign: "center", fontWeight: "bold", fontSize: "1.5rem", color: "black" }}>Push Notification</h1>
                {/* <Box sx={{ display: "flex", alignItems: "center", columnGap: 2 }}>
                    <span style={{ color: "black", fontWeight: "bold" }} suppressHydrationWarning>최근 DB 업데이트 시간: {new Date(updatedAt ?? 0).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} (KST)</span>
                    <Button onClick={callLambda} sx={{ backgroundColor: "red", color: "white", fontWeight: "bold", "&.Mui-disabled": { backgroundColor: "lightgrey" } }} disabled variant="contained">DB Refresh (필요 시*)</Button>
                </Box> */}
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
                        <FormControl fullWidth>
                            <InputLabel id="target-select-label">Target</InputLabel>
                            <Select
                                labelId='target-select-label'
                                id='target-select'
                                label="Target"
                                onChange={(e) => {
                                    setTarget(e.target.value as "toAll" | "toAdmin" | "toSelected");
                                    setSendAble(false);
                                }}
                                value={target}
                                sx={{ backgroundColor: "white", color: "black" }}
                            >
                                <MenuItem value="all">toAll</MenuItem>
                                <MenuItem value="admin">toAdmin</MenuItem>
                                {/* <MenuItem value="selected">toSelected</MenuItem> */}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel id="trigger-type-select-label">Trigger Type</InputLabel>
                            <Select
                                labelId='trigger-type-label'
                                id='trigger-type'
                                label="Trigger Type"
                                // disabled={selectedJob ? true : false}
                                onChange={(e) => {
                                    if (e.target.value !== "repeat") {
                                        setCronPattern("");
                                    }
                                    setTriggerType(e.target.value as "repeat" | "once" | "now");
                                    setSendAble(false);
                                }}
                                value={triggerType}
                                sx={{ backgroundColor: "white", color: "black" }}
                            >
                                <MenuItem value="repeat">repeat</MenuItem>
                                {/* <MenuItem value="once">once</MenuItem> */}
                                <MenuItem value="now">now</MenuItem>
                            </Select>
                        </FormControl>
                        {triggerType === "repeat" && <TextField fullWidth label="Cron Pattern" onChange={(e) => {
                            setCronPattern(e.target.value); 0
                            setSendAble(false);
                        }} value={cronPattern} placeholder='* * * * * *' sx={{ backgroundColor: "white", color: "black" }} />}
                        <TextField label="Title" fullWidth onChange={(e) => {
                            setTitle(e.target.value);
                        }} value={title} sx={{ backgroundColor: "white", color: "black" }} />
                        <textarea
                            onChange={(e) => {
                                setMessage(e.target.value);
                                setSendAble(false);
                            }}
                            value={message}
                            id="outlined-required"
                            placeholder="Message"
                            style={{
                                width: "100%", height: "100%", resize: "none", border: "1px solid #ccc", borderRadius: "4px", padding: "8px", boxSizing: "border-box"
                            }}
                        />

                    </Card>
                    <Box sx={{ display: "flex", flexDirection: "column", rowGap: 2, width: "100%" }}>
                        <Button variant="contained" sx={{ backgroundColor: "skyblue" }} onClick={() => sendPushNotification({ precheck: true })}>Send (Pre-check)</Button>
                        <Button variant="contained" sx={{ backgroundColor: "red" }} onClick={() => sendPushNotification({ precheck: false })} disabled={!sendAble}>* Send *</Button>
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