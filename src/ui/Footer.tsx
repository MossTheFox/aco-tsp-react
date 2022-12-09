import { GitHub } from "@mui/icons-material";
import { Avatar, Box, Container, IconButton, Stack, Typography } from "@mui/material";
import { useCallback, useState, useContext } from "react";


function Footer() {
    return <Container maxWidth={false} sx={{
        py: 2
    }}>
        <Stack spacing={1}
            alignItems="center"
            textAlign="center"
        >
            <Stack spacing={0.5} pb={1} direction="row" alignItems="center">
                <IconButton target="_blank" href="https://github.com/MossTheFox/aco-tsp-react"><GitHub /></IconButton>
            </Stack>
            <Box pb={1}>
                <Typography variant="body2" color="textSecondary">
                    蚁群算法与旅行商问题 可视化演示 | 小黑屋 (mxowl.com)
                </Typography>
            </Box>
        </Stack>
    </Container>
}

export default Footer;