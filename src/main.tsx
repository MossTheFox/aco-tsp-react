import { Box, CssBaseline } from '@mui/material'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ACOContextProvider } from './scripts/ACOContext'
import MainContainer from './ui/MainContainer'
import WrappedThemeProvider from './ui/WrappedThemeProvider'




ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <CssBaseline />
        <WrappedThemeProvider>

            {/* 设置全局上下文 */}
            <ACOContextProvider>
                <MainContainer>
                    <Box minHeight={'100vh'}>
                        <App />
                    </Box>
                </MainContainer>
            </ACOContextProvider>
        </WrappedThemeProvider>
    </React.StrictMode>
)
