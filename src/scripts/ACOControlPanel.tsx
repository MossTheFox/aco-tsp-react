import { AcoContext } from './ACOContext'
import { Box, Container, Grid, Stack, Typography } from '@mui/material';
import { useContext } from 'react';

function ACOControlPanel() {

    const context = useContext(AcoContext);

    return <Box>
        <Typography variant="h6" fontWeight={"bolder"} gutterBottom
            borderBottom={1}
            borderColor={'divider'}
        >
            参数设置
        </Typography>
        <Stack spacing={2}>
            <Box>
                <Typography gutterBottom>地图尺寸 (px)</Typography>
                    
            </Box>
        </Stack>
    </Box>;
}

export default ACOControlPanel;
