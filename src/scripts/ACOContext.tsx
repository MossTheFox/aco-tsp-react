import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import AntColony, { ACOConfig, defaultACOConfig } from "./classes/AntColony";
import CanvasArtist from "./classes/CanvasArtist";
import CanvasMain from "./classes/CanvasMain";

export type ACODemoConfig = ACOConfig & {
    canvasSize: {
        width: number;
        height: number;
    },
    pixelRatio: number;
    animationFramesPerIteration: number;
};

type ACOControllers = {
    canvasMain: CanvasMain,
    ac: AntColony,
    acoArtist: CanvasArtist
};

export const AcoContext = createContext<{
    config: ACODemoConfig,
    set: (key: keyof ACODemoConfig, value: ACODemoConfig[typeof key]) => void,
    init: () => void,
    controllers: ACOControllers | null
}>({
    config: {
        ...defaultACOConfig,
        canvasSize: {
            width: 720,
            height: 640
        },
        pixelRatio: 1,
        animationFramesPerIteration: 60,
    },
    set: () => { },
    init: () => { },
    controllers: null
});

export function ACOContextProvider({ children }: { children?: React.ReactNode }) {

    const [acoConfig, setACOConfig] = useState<ACODemoConfig>({
        ...defaultACOConfig,
        canvasSize: {
            width: 720,
            height: 640
        },
        pixelRatio: 1,
        animationFramesPerIteration: 60
    });
    const [acoControllers, setACOControllers] = useState<ACOControllers | null>(null);

    const set = useCallback((key: keyof ACODemoConfig, value: ACODemoConfig[typeof key]) => {
        setACOConfig((prev) => ({
            ...prev,
            [key]: value
        }));
    }, []);

    const init = useCallback(() => {
        if (!acoControllers) {
            let canvas = new CanvasMain();
            let ac = new AntColony(acoConfig);
            let canvasArtist = new CanvasArtist(ac, canvas);
            setACOControllers({
                canvasMain: canvas,
                ac,
                acoArtist: canvasArtist
            });
        }
    }, [acoControllers, acoConfig]);

    const theContext = useMemo(() => {
        return {
            config: acoConfig,
            set,
            init,
            controllers: acoControllers
        };
    }, [acoConfig, acoControllers, set, init]);

    // Update Config...
    useEffect(() => {
        if (acoControllers) {
            acoControllers.acoArtist.resize({
                width: acoConfig.canvasSize.width,
                height: acoConfig.canvasSize.height
            });
            acoControllers.ac.config(acoConfig);
        }
    }, [acoControllers, acoConfig]);

    return <AcoContext.Provider value={theContext}>
        {children}
    </AcoContext.Provider>
}