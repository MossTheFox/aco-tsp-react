import { AcoContext } from './ACOContext'
import { Box, Container, FormControl, FormHelperText, Grid, MenuItem, Select, Stack, Typography } from '@mui/material';
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

            <Box>
                <Typography gutterBottom>模式</Typography>
                <FormControl fullWidth>
                    <Select size='small' value={context.config.type}
                        onChange={(e) => context.set('type', e.target.value as 'maxmin' | 'elitist' | 'acs')}
                    // label="ACO 模式"
                    >
                        <MenuItem value={'acs'}>ACS</MenuItem>
                        <MenuItem value={'maxmin'}>Max-Min</MenuItem>
                        <MenuItem value={'elitist'}>Elitist</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            {context.config.type === 'maxmin' && (
                <Box>
                    <Typography gutterBottom>最小信息素保留倍率</Typography>
                    <FormControl fullWidth>
                        <Select size='small' value={context.config.minPheromoneScalingFactor}
                            onChange={(e) => context.set('minPheromoneScalingFactor', +e.target.value)}
                        // label="ACO 模式"
                        >
                            <MenuItem value={0.0001}>0.0001</MenuItem>
                            <MenuItem value={0.001}>0.001</MenuItem>
                            <MenuItem value={0.01}>0.01</MenuItem>
                            <MenuItem value={0.1}>0.1</MenuItem>
                        </Select>
                        <FormHelperText>最小保留的信息素 = 此倍率 * 当前最大信息素</FormHelperText>
                    </FormControl>
                </Box>
            )}



        </Stack>
    </Box>;
}

export default ACOControlPanel;
