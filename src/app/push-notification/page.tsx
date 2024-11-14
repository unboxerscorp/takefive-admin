"use client"

import { Box, Button, Card, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import React from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useSnackbar } from "notistack";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import { DateTimeField } from '@mui/x-date-pickers/DateTimeField';
import PageTitle from '@/utils/page-title';

export default function PushNotification() {
    const [title, setTitle] = React.useState<string>("");
    const [message, setMessage] = React.useState<string>("");
    const [target, setTarget] = React.useState<string>("");
    const [triggerType, setTriggerType] = React.useState<TriggerDataType | "">("");
    const [cronPattern, setCronPattern] = React.useState<string>("");
    const [delayTime, setDelayTime] = React.useState<Dayjs | null>(null);
    const [sendAble, setSendAble] = React.useState<boolean>(false);
    const { enqueueSnackbar } = useSnackbar();

    async function sendNotificationJob() {
        const queueName = "notificationQueue";
        const jobName = target === "all" ? "sendPushNotificationToAll" : target === "selected" ? "sendPushNotificationToSelected" : "sendPushNotificationToAdmin";

        const jobData = {
            title,
            message,
            dryRun: false,
        };

        const requestData: { queueName: string, jobName: string, jobData: Record<string, unknown>, trigger: Trigger | null } = {
            queueName,
            jobName,
            jobData,
            trigger: null,
        }

        if (triggerType === "repeat") {
            requestData.trigger = {
                type: "repeat",
                data: cronPattern
            }
        } else if (triggerType === "delay") {
            requestData.trigger = {
                type: "delay",
                data: delayTime?.toDate().getTime()
            }
        } else if (triggerType === "now") {
            requestData.trigger = {
                type: "now"
            }
        }
        await fetch("/api/schedule", {
            method: "POST",
            body: JSON.stringify(requestData)
        }).then(async (response) => {
            if (response.ok) {
                resetInput();
            }
        });
    }

    const resetInput = () => {
        setTarget("");
        setTriggerType("");
        setCronPattern("");
        setDelayTime(null);
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

        if (triggerType === "delay") {
            if (!delayTime) {
                enqueueSnackbar("Delay time is required", {
                    variant: "error",
                    autoHideDuration: 10000,
                    anchorOrigin: { vertical: "bottom", horizontal: "right" }
                })
                return;
            } else if (delayTime.isBefore(dayjs())) {
                enqueueSnackbar("Delay time must be in the future", {
                    variant: "error",
                    autoHideDuration: 10000,
                    anchorOrigin: { vertical: "bottom", horizontal: "right" }
                })
                return;
            }
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

    return (<LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ height: '100%', width: '100%', background: "white", display: "flex", flexDirection: "column", rowGap: 5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <PageTitle title="Push Notification" />
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
                                onChange={(e) => {
                                    if (e.target.value !== "repeat") {
                                        setCronPattern("");
                                    }

                                    if (e.target.value === "delay") {
                                        setDelayTime(dayjs());
                                    } else {
                                        setDelayTime(null);
                                    }
                                    setTriggerType(e.target.value as TriggerDataType);
                                    setSendAble(false);
                                }}
                                value={triggerType}
                                sx={{ backgroundColor: "white", color: "black" }}
                            >
                                <MenuItem value="repeat">repeat</MenuItem>
                                <MenuItem value="delay">delay</MenuItem>
                                <MenuItem value="now">now</MenuItem>
                            </Select>
                        </FormControl>
                        {triggerType === "repeat" ? <TextField fullWidth label="Cron Pattern" onChange={(e) => {
                            setCronPattern(e.target.value);
                            setSendAble(false);
                        }} value={cronPattern} placeholder='* * * * * *' sx={{ backgroundColor: "white", color: "black" }} /> : triggerType === "delay" ? <DateTimeField
                            sx={{ backgroundColor: "white", color: "black" }}
                            format='YYYY-MM-DD HH:mm:ss'
                            label="Controlled picker"
                            value={delayTime}
                            onChange={(newValue) => { setDelayTime(newValue); setSendAble(false); }}
                        /> : null}
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
            </Box>
        </Box>
    </LocalizationProvider>
    );
}