import { AcoContext } from './ACOContext'
import { Box, Button, Checkbox, Container, Divider, FormControl, FormControlLabel, FormHelperText, Grid, Link, MenuItem, Select, Slider, Stack, Typography } from '@mui/material';
import { useCallback, useContext, useEffect, useState } from 'react';

const average = (...args: number[]) => {
    let len = args.length;
    let result = 0;
    for (const i of args) {
        result += i / len;
    }
    return result;
};

function ACOControlPanel() {

    const context = useContext(AcoContext);

    const [manuallyInput, setManuallyInput] = useState(false);
    const toggleInputMode = useCallback(() => {
        setManuallyInput((v) => !v);
    }, []);

    const [quickMode, setQuickMode] = useState(false);
    useEffect(() => {
        if (!context.controllers) return;
        if (quickMode) {
            context.controllers.acoArtist.antAnimationFrames = 0;
        } else {
            context.controllers.acoArtist.antAnimationFrames = 16;
        }
    }, [context.controllers, quickMode]);

    // 状态: 
    // 未开始 | 进行中 / 暂停 | 结束
    const [hasStarted, setHasStarted] = useState(false);
    const [paused, setPaused] = useState(false);

    const [hold, setHold] = useState(false);
    const [statusText, setStatusText] = useState('');

    const stepFinCallback = useCallback(() => {
        if (!context.controllers) return;
        let stat = context.controllers.acoArtist.getStatus();
        // update text
        setStatusText(`迭代 ${stat.currentIteration} / ${stat.maxIterations} \n`
            + `当前迭代最优: ${stat.currentIterationBestDistance.toFixed(2)}\n`
            + `全局最优: ${stat.globalBestDistance.toFixed(2)}\n`
            + `第 ${stat.globalBestFromIteration} 次迭代达到最优\n`
            + `全局最优解刷新次数: ${stat.globalBestRefreshTime}\n`
            + `每个迭代的最优值取平均: ${average(...stat.iterationBestDistanceRecord).toFixed(2)}\n`
        );

        if (stat.finished) {
            setHold(false);
            setHasStarted(false);
            setPaused(false);
            return;
        }
    }, [context.controllers]);

    const startOrPause = useCallback(() => {
        if (!context.controllers) return;

        if (!hasStarted) {
            if (context.controllers.ac.graph.cities.length < 2) {
                setStatusText(`点击地图添加至少 2 个点 (城市) 以开始运行。`);
                return;
            }
            // 第一步
            context.controllers.acoArtist.run();
            // 更新首次迭代的状态
            stepFinCallback();

            setHasStarted(true);
            return;
        }

        context.controllers.acoArtist.autoGoOn = true;
        if (paused) {
            let stat = context.controllers.acoArtist.getStatus();
            stat.goOn();
            setPaused(false);
        } else {
            context.controllers.acoArtist.pause();
            setPaused(true);
        }
    }, [hasStarted, paused, context.controllers]);

    const step = useCallback(() => {
        if (!context.controllers) return;
        context.controllers.acoArtist.autoGoOn = false;
        context.controllers.acoArtist.step(true);
    }, [context.controllers]);

    const stop = useCallback(() => {
        if (!context.controllers) return;
        setPaused(false);
        setHasStarted(false);
        context.controllers.ac.reset();
        context.controllers.acoArtist.stop();
    }, [context.controllers]);

    useEffect(() => {
        if (!context.controllers || !hasStarted) return;
        context.controllers.acoArtist.iterationHook = stepFinCallback;
        context.controllers.acoArtist.forceStopHook = stop;

        return () => {
            context.controllers && (context.controllers.acoArtist.iterationHook = null);
            context.controllers && (context.controllers.acoArtist.forceStopHook = null);
        };
    }, [hasStarted, stepFinCallback, stop, context.controllers]);

    // 重置、保存、读取

    const resetCities = useCallback(() => {
        context.controllers?.acoArtist.clearGraph();
        setStatusText('已重置城市点位列表。');
    }, [context.controllers]);

    const saveCityData = useCallback(() => {
        if (!context.controllers) return;
        let cities = context.controllers.ac.graph.cities;
        if (!localStorage) {
            setStatusText('你的浏览器禁用了 localStorage。无法存储状态。');
            return;
        }
        if (cities.length === 0) {
            setStatusText('当前城市点位列表为空。');
            return;
        }
        localStorage.setItem('aco-cities-save-1', JSON.stringify(cities));
        setStatusText('点位信息已保存。');
    }, [context.controllers]);

    const loadCityData = useCallback(() => {
        if (!context.controllers) return;
        let cities = context.controllers.ac.graph.cities;
        if (!localStorage) {
            setStatusText('你的浏览器禁用了 localStorage。无法存储状态。');
            return;
        }
        let savedCities = localStorage.getItem('aco-cities-save-1');
        if (!savedCities) {
            setStatusText('没有存储过点位信息。');
            return;
        }
        cities.splice(0, cities.length);
        let items = JSON.parse(savedCities) as ({ "_x": number; "_y": number; })[];
        for (const i of items) {
            context.controllers.ac.graph.addCity(i._x, i._y);
        }
        context.controllers.ac.graph.createEdges();
        context.controllers.acoArtist.draw();
        setStatusText('已读取存储的点位信息。');
    }, [context.controllers]);

    const loadCityFromClipboard = useCallback(async () => {
        if (!context.controllers) return;
        try {
            let data = await navigator.clipboard.readText();
            let items = JSON.parse(data) as ({ "_x": number; "_y": number; })[];
            if (items && Array.isArray(items) && '_x' in items[0] && '_y' in items[0]) {
                context.controllers.ac.graph.clear();
                for (const i of items) {
                    context.controllers.ac.graph.addCity(i._x, i._y);
                }
                context.controllers.ac.graph.createEdges();
                context.controllers.acoArtist.draw();
                setStatusText('已读取剪切板中的点位信息。');
            } else {
                throw new SyntaxError();
            }
        } catch (err) {
            if (err instanceof SyntaxError) {
                setStatusText('剪切板数据无效。\n(预期格式: JSON, Array<{ "_x": number; "_y": number; }>');
            } else {
                setStatusText(`读取剪切板出错, ${err}`);
            }
        }
    }, [context.controllers]);



    return <Box>
        <Typography variant="h6" gutterBottom
            borderBottom={1}
            borderColor={'divider'}
        >
            <Typography variant="h6" fontWeight={"bolder"} component="span" mr={1}>
                参数设置
            </Typography>
            <Link component={'button'} variant="body2"
                onClick={toggleInputMode}
                sx={{
                    textDecoration: 'none',
                    width: 0,
                    overflow: 'visible',
                    whiteSpace: 'nowrap'
                }}
                // TODO:
                hidden
            >{manuallyInput ? '返回默认' : '手动输入'}</Link>
        </Typography>
        <Stack spacing={2}>
            <Box>
                <Typography gutterBottom>地图尺寸 (px)</Typography>
                <Typography variant="body2">
                    {`宽: ${context.config.canvasWidth}px, 高 ${context.config.canvasHeight}px`}
                </Typography>
            </Box>

            <Box>
                <FormControlLabel sx={{ mb: -1 }} control={<Checkbox value={quickMode} onChange={(e, checked) => setQuickMode(checked)} size='small' />} label="快速模式" />
                <FormHelperText>跳过绘制蚂蚁个体的过程</FormHelperText>
            </Box>

            <Divider />

            <Box>
                {/* <Typography gutterBottom>开始/停止/步进</Typography> */}

                <Stack direction={'row'} spacing={1} justifyContent="center">
                    <Button size="small" variant="contained"
                        color={hasStarted ? (
                            paused ? 'primary' : 'warning'
                        ) : 'primary'}
                        onClick={startOrPause}
                        disabled={hold}
                    >
                        {hasStarted ? (
                            paused ? '继续' : '暂停'
                        ) : '开始'}
                    </Button>
                    {hasStarted &&
                        <Button size="small" variant="outlined"
                            disabled={!paused || hold}
                            onClick={step}
                        >步进</Button>
                    }
                </Stack>
            </Box>

            {hasStarted &&
                <Stack spacing={1} alignItems="center">
                    <Button size="small" variant="outlined"
                        color="error"
                        onClick={stop}
                    >终止</Button>
                </Stack>
            }

            <Typography variant="body2" gutterBottom
                sx={{
                    whiteSpace: 'pre-wrap'
                }}
            >{statusText}</Typography>

            {!hasStarted && <Box>
                <Stack spacing={1} alignItems="center">
                    <Button size="small" variant="outlined"
                        color="warning"
                        onClick={resetCities}
                    >重置所有点</Button>
                    <Box textAlign='center'>
                        <Button size="small" onClick={saveCityData}>保存点位信息</Button>
                        <Button size="small" onClick={loadCityData}>读取保存的点位信息</Button>
                    <Button size="small" onClick={loadCityFromClipboard}>从剪切板导入点位信息</Button>
                    </Box>
                </Stack>
            </Box>}

            <Divider />

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

            {context.config.type === 'elitist' && (
                <Box>
                    <Typography gutterBottom>精英个体释放的额外信息素倍率</Typography>
                    <FormControl fullWidth>
                        <Select size='small' value={context.config.elitistWeight}
                            onChange={(e) => context.set('elitistWeight', +e.target.value)}
                        // label="ACO 模式"
                        >
                            <MenuItem value={0.1}>0.1</MenuItem>
                            <MenuItem value={0.5}>0.5</MenuItem>
                            <MenuItem value={1}>1</MenuItem>
                            <MenuItem value={2}>2</MenuItem>
                            <MenuItem value={5}>5</MenuItem>
                            <MenuItem value={10}>10</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            )}

            <Divider />

            <Box>
                <Typography gutterBottom>蚁群规模 ({context.config.colonySize})</Typography>
                <Slider
                    value={context.config.colonySize}
                    step={5}
                    min={5}
                    max={200}
                    onChange={(e, v) => context.set('colonySize', +v)}
                // valueLabelDisplay="auto"
                />
                {/* <FormControlLabel control={<Checkbox />} label="显示蚁群" sx={{ userSelect: 'none' }} />
                <FormHelperText>蚁群数量较大时，绘制时会有性能问题？（待定）</FormHelperText> */}
            </Box>

            <Box>
                <Typography gutterBottom>迭代次数 ({context.config.maxIterations})</Typography>
                <Slider
                    value={context.config.maxIterations}
                    step={10}
                    min={10}
                    max={500}
                    onChange={(e, v) => context.set('maxIterations', +v)}
                />
            </Box>

            <Divider />

            <Box>
                <Typography gutterBottom>α ({context.config.alpha})</Typography>
                <FormHelperText>计算权重时，信息素的指数大小</FormHelperText>
                <Slider
                    value={context.config.alpha}
                    step={1}
                    min={1}
                    max={15}
                    onChange={(e, v) => context.set('alpha', +v)}
                />
            </Box>
            <Box>
                <Typography gutterBottom>β ({context.config.beta})</Typography>
                <FormHelperText>计算权重时，启发值的指数大小</FormHelperText>
                <Slider
                    value={context.config.beta}
                    step={1}
                    min={1}
                    max={15}
                    onChange={(e, v) => context.set('beta', +v)}
                />
            </Box>
            <Box>
                <Typography gutterBottom>ρ
                </Typography>
                <FormHelperText sx={{ mb: 1 }}>信息素蒸发率</FormHelperText>
                <FormControl fullWidth>
                    <Select size='small' value={context.config.rho}
                        onChange={(e) => context.set('rho', +e.target.value)}
                    >
                        <MenuItem value={0}>0</MenuItem>
                        <MenuItem value={0.001}>0.001</MenuItem>
                        <MenuItem value={0.01}>0.01</MenuItem>
                        <MenuItem value={0.05}>0.05</MenuItem>
                        <MenuItem value={0.1}>0.1</MenuItem>
                        <MenuItem value={0.2}>0.2</MenuItem>
                        <MenuItem value={0.5}>0.5</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Divider />

            <Box>
                <Typography gutterBottom>初始信息素强度
                </Typography>
                <FormControl fullWidth>
                    <Select size='small' value={context.config.initialPheromone}
                        onChange={(e) => context.set('initialPheromone', +e.target.value)}
                    >
                        <MenuItem value={0}>0</MenuItem>
                        <MenuItem value={1}>1</MenuItem>
                        <MenuItem value={2}>2</MenuItem>
                        <MenuItem value={5}>5</MenuItem>
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={20}>20</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            <Box>
                <Typography gutterBottom>Q
                </Typography>
                <FormHelperText sx={{ mb: 1 }}>信息素释放的强度参数</FormHelperText>
                <FormControl fullWidth>
                    <Select size='small' value={context.config.q}
                        onChange={(e) => context.set('q', +e.target.value)}
                    >
                        <MenuItem value={1}>1</MenuItem>
                        <MenuItem value={2}>2</MenuItem>
                        <MenuItem value={5}>5</MenuItem>
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={20}>20</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                    </Select>
                </FormControl>
            </Box>

        </Stack>

    </Box>;
}

export default ACOControlPanel;
