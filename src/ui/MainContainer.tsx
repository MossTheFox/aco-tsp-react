import { Box } from "@mui/material";

function MainContainer({ children }: { children: React.ReactNode }) {
    /**
     * 这里的情况是，Safari PWA 的状态栏想要应用主题色，则需要设置为透明、并使用页面 background-color 设置主题色
     * 然后，为了保证页面本身可视范围内的背景还是白色/黑色，这边用这个额外的 Box 来包裹页面内容。
     * 放在的位置：ThemeProvider 与 CSSBaseline 之后
     */
    return <Box
        sx={{
            backgroundColor: (theme) => theme.palette.mode === "dark" ? "unset" : "#faf9f6",
            overflowX: 'hidden',
        }}
    >
        {children}
    </Box>
}

export default MainContainer;