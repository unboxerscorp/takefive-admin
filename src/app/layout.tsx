import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import ToggleOn from '@mui/icons-material/ToggleOnOutlined';
import NotificationIcon from '@mui/icons-material/NotificationsOutlined';
import ScheduleIcon from '@mui/icons-material/ScheduleOutlined';
import BullIcon from '@mui/icons-material/AdsClick';
import { headers } from "next/headers";
import SnackbarWrapper from "@/utils/snackbar-wrapper";
import { ContextWrapper } from "@/misc/context";
import React from "react";

const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  variable: '--font-pretendard',
})

export const metadata: Metadata = {
  title: "TakeFive Admin Page",
  description: "TakeFive Admin Page",
};

const drawerWidth = 240;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const pathName = requestHeaders.get("x-pathname") || "/";

  return (
    <html lang="en">
      <body
        className={`${pretendard.variable} font-pretendard`}
      >
        <SnackbarWrapper>
          <Box sx={{ display: 'flex' }}>
            <Drawer
              sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                  width: drawerWidth,
                  boxSizing: 'border-box',
                },
              }}
              variant="permanent"
              anchor="left"
            >
              <List>
                <ListItem disablePadding>
                  <ListItemButton href="/online-users">
                    <ListItemIcon>
                      <ToggleOn sx={{ color: 'yellowgreen' }} />
                    </ListItemIcon>
                    <ListItemText primary="Online Users" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton href="/push-notification">
                    <ListItemIcon>
                      <NotificationIcon sx={{ color: 'orange' }} />
                    </ListItemIcon>
                    <ListItemText primary="Push Notification" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton href="/scheduler">
                    <ListItemIcon>
                      <ScheduleIcon sx={{ color: 'red' }} />
                    </ListItemIcon>
                    <ListItemText primary="Scheduler" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton href="/bullboard">
                    <ListItemIcon>
                      <BullIcon sx={{ color: 'red' }} />
                    </ListItemIcon>
                    <ListItemText primary="Bull Board" />
                  </ListItemButton>
                </ListItem>
              </List>
            </Drawer>
            <ContextWrapper>
              <Box
                component="main"
                sx={{ flexGrow: 1, bgcolor: 'background.default', p: ["/bullboard"].includes(pathName) ? 0 : 8, width: "100%", height: '100%' }}
              >
                {children}
              </Box>
            </ContextWrapper>
          </Box>
        </SnackbarWrapper>
      </body>
    </html >
  );
}
