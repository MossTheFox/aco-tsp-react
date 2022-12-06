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

        // 👇 ROUND, 解决半像素造成的缩放问题…… 参考 https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
        let fixedWidth = Math.round(containerRect.width * window.devicePixelRatio);
        // let user decide the height...
        // acoContext.controllers.acoArtist.resize({ width: fixedWidth }, acoContext.config.pixelRatio);
        acoContext.set('canvasWidth', fixedWidth);
    }, [canvasContainerRef, acoContext.controllers /* , acoContext.config.pixelRatio */]);

    useEffect(() => {
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

    const startDragging = useCallback((e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.TouchEvent<HTMLButtonElement>) => {
        let positionY = -1;
        if ('touches' in e) {
            positionY = e.touches[0].clientY;
        } else {
            positionY = e.clientY;
        }
        if (!canvasContainerRef.current) return;
        setDragging(true);
        setMouseBeginY(positionY);

        let rect = canvasContainerRef.current.getBoundingClientRect();
        setCanvasBeginHeight(rect.height);
    }, [canvasContainerRef]);
    const endDragging = useCallback(() => {
        setDragging(false);
        setMouseBeginY(-1);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        let positionY = -1;
        if ('touches' in e) {
            positionY = e.touches[0].clientY;
        } else {
            positionY = e.clientY;
        }
        if (!dragging) return;
        if (!canvasContainerRef.current || mouseBeginY < 0 || canvasBeginHeight < 0) return;
        let deltaY = positionY - mouseBeginY;
        // ignore < 100px
        let finalHeight = canvasBeginHeight + deltaY;
        if (finalHeight < 100) finalHeight = 100;
        // 取整……
        acoContext.set('canvasHeight', Math.floor(finalHeight * window.devicePixelRatio));
        // console.log(`Height: ${canvasBeginHeight} + ${deltaY} (delta: clientY ${e.clientY} mouseBeginY ${mouseBeginY})`);
    }, [dragging, canvasContainerRef, mouseBeginY, canvasBeginHeight, acoContext.set]);

    useEffect(() => {
        if (dragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('touchmove', handleMouseMove);

            document.addEventListener('mouseup', endDragging);
            document.addEventListener('touchend', endDragging);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('touchmove', handleMouseMove);

                document.removeEventListener('mouseup', endDragging);
                document.addEventListener('touchend', endDragging);
            };
        }
    }, [dragging, handleMouseMove, endDragging]);


    return <Box>
        <Box ref={canvasContainerRef} />

        <Box py={2}>
            <Button fullWidth size="small"
                onMouseDown={startDragging}
                onTouchStart={startDragging}
                // variant="contained"
                children="⇳ 调整高度 ⇳" sx={{
                    cursor: 'ns-resize',
                    userSelect: 'none',
                    touchAction: 'none'
                }} />
        </Box>

    </Box>;
}

export default ACOCanvas;