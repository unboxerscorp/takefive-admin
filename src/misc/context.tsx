"use client";

import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import React from "react";
import { createContext } from "react";

export const Context = createContext({
    targetServer: "prod"
});

export const ContextWrapper = ({ children }: { children: React.ReactNode }) => {
    const [targetServer, setTargetServer] = React.useState<"prod" | "dev">("prod");

    return <Context.Provider value={{ targetServer }}>
        <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
            <div style={{ padding: "1rem" }}>
                <FormControl fullWidth>
                    <InputLabel id="target-select-label">Target Server</InputLabel>
                    <Select
                        labelId='target-select-label'
                        id='target-select'
                        label="Target"
                        onChange={(e) => {
                            setTargetServer(e.target.value as "prod" | "dev");
                        }}
                        value={targetServer}
                        sx={{ backgroundColor: "white", color: "black" }}
                    >
                        <MenuItem value="prod">Production</MenuItem>
                        <MenuItem value="dev">Develop</MenuItem>
                    </Select>
                </FormControl>
            </div>
            {children}
        </Box>
    </Context.Provider>;
};