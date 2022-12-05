import { Box } from '@mui/material';
import { useCallback, useContext, useEffect, useRef } from 'react';
import { AcoContext } from './ACOContext';

function ACOCanvas({ autoSizeUpdate = true }) {

    let canvasContainerRef = useRef<HTMLElement>(null);
    let acoContext = useContext(AcoContext);

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
            }

        }
    }, [canvasContainerRef, acoContext]);

    const onResize = useCallback(() => {
        if (!autoSizeUpdate || !canvasContainerRef.current) return;
        if (!acoContext.controllers) return;
        let containerRect = canvasContainerRef.current.getBoundingClientRect();
        
        let fixedWidth = containerRect.width * window.devicePixelRatio;
        // let user decide the height...
        // let fixedHeight = canvasContainerRef.current.clientHeight * window.devicePixelRatio;
        acoContext.controllers.acoArtist.resize({ width: fixedWidth }, acoContext.config.pixelRatio);
    }, [canvasContainerRef, acoContext.controllers, acoContext.config.pixelRatio]);

    useEffect(() => {
        // 可能会有性能问题……先不做
        onResize();
        window.addEventListener('resize', onResize);

        return () => window.removeEventListener('resize', onResize);
    }, [onResize]);


    return <Box ref={canvasContainerRef}>

    </Box>;
}

export default ACOCanvas;