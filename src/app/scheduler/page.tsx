"use client"

import { Box, Button, ButtonGroup, Card, FormControl, IconButton, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowParams, useGridApiRef } from '@mui/x-data-grid';
import { Job, RepeatableJob } from 'bullmq';
import React from 'react';
import { setTimeout } from 'timers';

export default function Scheduler() {
    const dataGridRef = useGridApiRef();
    const [jobs, setJobs] = React.useState<Record<string, Record<string, Job[] | RepeatableJob[]>>>({});
    const [columns, setColumns] = React.useState<GridColDef[]>([]);
    const [rows, setRows] = React.useState<Record<string, any>[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [dataRefreshedAt, setDataRefreshedAt] = React.useState<number>(0);

    const [queueName, setQueueName] = React.useState<"matchingQueue" | "notificationQueue" | "testQueue" | "">("");
    const [triggerType, setTriggerType] = React.useState<TriggerDataType | "">("");
    const [cronPattern, setCronPattern] = React.useState<string>("");
    const [jobName, setJobName] = React.useState<string>("");
    const [message, setMessage] = React.useState<string>("");
    const [jobData, setJobData] = React.useState<any>({});
    const [selectedJob, setSelectedJob] = React.useState<any>(null);

    async function getJobs() {
        await fetch("/api/schedule", {
            method: "GET",
        }).then(async (response) => {
            const { jobs } = await response.json();
            console.log(jobs)
            setJobs(jobs);
            setDataRefreshedAt(Date.now());
        });
    }

    async function addJob() {
        if (!queueName || !jobName || !jobData) {
            console.error(`Missing required fields: queueName, jobName, and jobData`);
            return;
        }

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
                await getJobs();
            }
        }).finally(() => {
            setIsLoading(false);
        });
    }

    async function deleteJob({ queueName, key }: { queueName: string, key: string }) {
        setIsLoading(true);
        fetch("/api/schedule", {
            method: "DELETE",
            body: JSON.stringify({
                queueName: queueName,
                jobSchedulerId: key
            })
        }).then(async (response) => {
            await getJobs();
        }).finally(() => {
            setIsLoading(false);
        });
    }

    React.useEffect(() => {
        setIsLoading(true);
        getJobs().finally(() => {
            setIsLoading(false);
        });
    }, []);

    const resetInput = () => {
        setSelectedJob(null);
        setQueueName("");
        setTriggerType("");
        setCronPattern("");
        setJobName("");
        setMessage("");
        dataGridRef.current?.selectRow(0, false, true);
    }

    const getJobData = (params: GridRenderCellParams | GridRowParams) => {
        const queue = jobs[params.row.queueName];
        if (queue) {
            const jobs: Job[] = queue.jobs as Job[];
            const job = jobs.find((job) => job.repeatJobKey === params.row.key);
            if (job) {
                const { jobData } = job.data;
                return JSON.stringify(jobData, null, 2);
            }
        }
    }

    React.useEffect(() => {
        if (Object.values(jobs).length === 0) {
            setRows([]);
            setColumns([]);
        } else {
            const newRows: Record<string, any>[] = []
            Object.values(jobs).forEach((queueJobs) => {
                queueJobs.schedulers.forEach((scheduler) => {
                    const { key, next, pattern } = scheduler as RepeatableJob;
                    const [queueName, jobName, triggerType] = key.split(":")
                    newRows.push({
                        key, queueName, jobName, triggerType, next, pattern
                    })
                })
            })
            setRows(newRows);
            setColumns([
                { field: "key", headerName: "Key", align: "center", headerAlign: "center" },
                { field: "queueName", headerName: "Queue", align: "center", headerAlign: "center" },
                { field: "jobName", headerName: "Name", align: "center", headerAlign: "center" },
                { field: "next", headerName: "Next", align: "center", headerAlign: "center", valueFormatter: (value: number) => new Date(value).toLocaleString("ko-KR") },
                { field: "triggerType", headerName: "Trigger", align: "center", headerAlign: "center" },
                { field: "pattern", headerName: "Cron", align: "center", headerAlign: "center" },
                {
                    field: "data", headerName: "Data", align: "center", headerAlign: "center", renderCell: getJobData
                }
            ]);
        }
    }, [jobs]);

    React.useEffect(() => {
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
                    if (rows.length > 0) {
                        dataGridRef.current.sortColumn("next", "asc");
                    }
                } else {
                    setIsLoading(false);
                }
            }, 200);
        }, 1000);

        return () => {
            if (outerTimeoutId) clearTimeout(outerTimeoutId);
            if (innerTimeoutId) clearTimeout(innerTimeoutId);
        };
    }, [rows, dataGridRef]);

    React.useEffect(() => {
        if (message) {
            try {
                const messageJson = JSON.parse(message);
                setJobData(messageJson);
            } catch (error) {
                setJobData(null);
            }
        }
    }, [message])

    return (
        <Box sx={{ height: '100%', width: '100%', background: "white", display: "flex", flexDirection: "column", rowGap: 5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ textAlign: "center", fontWeight: "bold", fontSize: "1.5rem", color: "black" }}>Scheduler</h1>
                <Box sx={{ display: "flex", columnGap: 2, justifyContent: "center", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", fontSize: "1rem", color: "black" }}>새로 고침 시간: {new Date(dataRefreshedAt).toLocaleString("ko-KR")}</span>
                    <Button variant="contained" onClick={getJobs}>Refresh</Button>
                </Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", flexGrow: 1, overflow: "hidden", flexDirection: "row", columnGap: 2 }}>
                <Box
                    flex={3}
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
                    <Card sx={{ background: selectedJob ? "sandybrown" : "lightblue", display: "flex", flexDirection: "column", rowGap: 3, padding: 5, width: "100%", height: "100%", textAlign: "center", justifyContent: "center", alignItems: "center" }} elevation={3}>
                        {/* <span style={{ color: "white", fontWeight: "bold", fontSize: "1.5rem" }}>알림 내용을 입력해주세요</span> */}
                        <FormControl fullWidth>
                            <InputLabel id="queue-select-label">Queue</InputLabel>
                            <Select
                                labelId='queue-select-label'
                                id='queue-select'
                                label="Queue"
                                disabled={selectedJob ? true : false}
                                onChange={(e) => {
                                    setQueueName(e.target.value as "matchingQueue" | "notificationQueue" | "testQueue");
                                }}
                                value={queueName}
                                sx={{ backgroundColor: "white", color: "black" }}
                            >
                                <MenuItem value="matchingQueue">matchingQueue</MenuItem>
                                <MenuItem value="notificationQueue">notificationQueue</MenuItem>
                                <MenuItem value="testQueue">testQueue</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField label="Job Name" fullWidth onChange={(e) => {
                            setJobName(e.target.value);
                        }} value={jobName} disabled={selectedJob ? true : false} sx={{ backgroundColor: "white", color: "black" }} />
                        <FormControl fullWidth>
                            <InputLabel id="trigger-type-select-label">Trigger Type</InputLabel>
                            <Select
                                labelId='trigger-type-label'
                                id='trigger-type'
                                label="Trigger Type"
                                disabled={selectedJob ? true : false}
                                onChange={(e) => {
                                    if (e.target.value !== "repeat") {
                                        setCronPattern("");
                                    }
                                    setTriggerType(e.target.value as TriggerDataType);
                                }}
                                value={triggerType}
                                sx={{ backgroundColor: "white", color: "black" }}
                            >
                                <MenuItem value="repeat">repeat</MenuItem>
                                {/* <MenuItem value="delay">delay</MenuItem> */}
                                <MenuItem value="now">now</MenuItem>
                            </Select>
                        </FormControl>
                        {triggerType === "repeat" && <TextField fullWidth label="Cron Pattern" onChange={(e) => {
                            setCronPattern(e.target.value);
                        }} value={cronPattern} placeholder='* * * * * *' sx={{ backgroundColor: "white", color: "black" }} />}
                        <textarea
                            onChange={(e) => {
                                setMessage(e.target.value);
                            }}
                            id="outlined-required"
                            style={{
                                width: "100%", height: "100%", resize: "none", border: "1px solid #ccc", borderRadius: "4px", padding: "8px", boxSizing: "border-box"
                            }}
                            value={message}
                        />
                        <ButtonGroup variant="contained" aria-label="Basic button group">
                            <Button sx={{ backgroundColor: "gold" }} onClick={resetInput}>Reset Input</Button>
                            <Button sx={{ backgroundColor: selectedJob ? "orange" : "blue" }} onClick={addJob}>{selectedJob ? "Update Job" : "Add Job"}</Button>
                            {selectedJob && <Button sx={{ backgroundColor: "red" }} onClick={() => deleteJob({ queueName: queueName, key: selectedJob.key })}>Delete Job</Button>}
                        </ButtonGroup>
                    </Card>
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
                        loading={isLoading}
                        getRowId={(row) => row.key}
                        initialState={{
                            columns: {
                                columnVisibilityModel: {
                                    key: false,
                                },
                            },
                        }}
                        onRowClick={(row) => {
                            setSelectedJob(row.row);
                            setQueueName(row.row.queueName);
                            setTriggerType(row.row.triggerType);
                            setCronPattern(row.row.pattern);
                            setJobName(row.row.jobName);
                            const message = getJobData(row);
                            setMessage(message ? message : "");
                        }}
                    />
                </Box>
            </Box>
        </Box >
    );
}

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}