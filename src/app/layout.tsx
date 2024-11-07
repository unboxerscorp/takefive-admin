import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import ToggleOn from '@mui/icons-material/ToggleOnOutlined';
import NotificationIcon from '@mui/icons-material/NotificationsOutlined';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "TakeFive Admin Page",
  description: "TakeFive Admin Page",
};

const drawerWidth = 240;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
            </List>
          </Drawer>
          <Box
            component="main"
            sx={{ flexGrow: 1, bgcolor: 'background.default', p: 10, width: `calc(100% - ${drawerWidth}px)`, height: '100vh' }}
          >
            {children}
          </Box>
        </Box>

      </body>
    </html>
  );
}
