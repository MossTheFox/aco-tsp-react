import { useMediaQuery, ThemeProvider } from '@mui/material'
import { useMemo } from 'react';
import { themeObject } from './theme';

function WrappedThemeProvider({ children }: { children: React.ReactNode }) {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const theme = useMemo(() => {
        if (prefersDarkMode) {
            return themeObject.dark;
        }
        return themeObject.light;
    }, [prefersDarkMode]);

    return <ThemeProvider theme={theme}>
        {children}
    </ThemeProvider>
}

export default WrappedThemeProvider;