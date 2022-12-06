import { Box, Button } from '@mui/material';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AcoContext } from './ACOContext';

function ACOCanvas({ autoSizeUpdate = true }) {

    let canvasContainerRef = useRef<HTMLElement>(null);
    let acoContext = useContext(AcoContext);

    const resize = useCallback(() => {
        if (!autoSizeUpdate || !canvasContainerRef.current) return;
        if (!acoContext.controllers) return;
        let containerRect = canvasContainerRef.current.getBoundingClientRect();

        let fixedWidth = containerRect.width * window.devicePixelRatio;
        // let user decide the height...
        // acoContext.controllers.acoArtist.resize({ width: fixedWidth }, acoContext.config.pixelRatio);
        acoContext.set('canvasWidth', fixedWidth);
    }, [canvasContainerRef, acoContext.controllers /* , acoContext.config.pixelRatio */]);

    useEffect(() => {
        // 可能会有性能问题……先不做
        resize();
        window.addEventListener('resize', resize);

        return () => window.removeEventListener('resize', resize);
    }, [resize]);

    useEffect(() => {
        if (canvasContainerRef.current) {
            // init
            if (!acoContext.controllers) {
                acoContext.init();
            }
            const controllers = acoContext.controllers;
            if (!controllers) return;

            // update container when changed
            if (canvasContainerRef.current !== controllers.canvasMain.containerRef) {
                controllers.canvasMain.switchCanvasContainer(canvasContainerRef.current);
                resize();
            }

        }
    }, [canvasContainerRef, acoContext, resize]);

    // 下面是拖拽动作
    const [dragging, setDragging] = useState(false);
    const [mouseBeginY, setMouseBeginY] = useState(-1);
    const [canvasBeginHeight, setCanvasBeginHeight] = useState(-1);

    const startDragging = useCallback((e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (!canvasContainerRef.current) return;
        setDragging(true);
        setMouseBeginY(e.clientY);

        let rect = canvasContainerRef.current.getBoundingClientRect();
        setCanvasBeginHeight(rect.height);
    }, [canvasContainerRef]);
    const endDragging = useCallback(() => {
        setDragging(false);
        setMouseBeginY(-1);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging) return;
        if (!canvasContainerRef.current || mouseBeginY < 0 || canvasBeginHeight < 0) return;
        let deltaY = e.clientY - mouseBeginY;
        acoContext.set('canvasHeight', (canvasBeginHeight + deltaY) * acoContext.config.pixelRatio);
        // console.log(`Height: ${canvasBeginHeight} + ${deltaY} (delta: clientY ${e.clientY} mouseBeginY ${mouseBeginY})`);
    }, [dragging, canvasContainerRef, mouseBeginY, canvasBeginHeight, acoContext.set, acoContext.config.pixelRatio]);

    useEffect(() => {
        if (dragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', endDragging);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', endDragging);
            };
        }
    }, [dragging, handleMouseMove, endDragging]);


    return <Box>
        <Box ref={canvasContainerRef} />

        <Box py={2}>
            <Button fullWidth size="small"
                onMouseDown={startDragging}
                variant="contained"
                children="⇳ 调整高度 ⇳" sx={{
                    cursor: 'ns-resize'
                }} />
        </Box>

    </Box>;
}

export default ACOCanvas;