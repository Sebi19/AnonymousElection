import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom'
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from '@mantine/notifications';

// 1. Import Core Mantine Styles
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css'; // If using date pickers
import 'mantine-react-table/styles.css'; // MRT Styles
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';

import App from './App.tsx'
import {AuthProvider} from "./features/auth/AuthContext.tsx";

const theme = createTheme({
    /** Put your mantine theme override here */
    primaryColor: 'blue',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <MantineProvider theme={theme} defaultColorScheme={"auto"}>
            <Notifications position={"bottom-right"} />
            <ModalsProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </AuthProvider>
            </ModalsProvider>
        </MantineProvider>
    </React.StrictMode>,
)