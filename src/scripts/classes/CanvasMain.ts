class CanvasMain {
    elemtRef: HTMLCanvasElement;
    containerRef: HTMLElement | null;
    size: { height: number; width: number; };
    devicePixelRatio: number;
    canvas2D: CanvasRenderingContext2D;
    canvasPosition: DOMRect;
    mousePosition: { x: number; y: number; };

    clickHook: (() => void) | null;
    mouseMoveHook: (() => void) | null;

    constructor(canvasHolder: HTMLElement | null = null, width: number = 100, height: number = 100) {
        this.containerRef = canvasHolder;
        const canvasId = 'aoc-demo-canvas';
        this.size = {
            width,
            height
        };
        this.devicePixelRatio = 1;
        // canvasHolder.style.maxWidth = this.size.width + '';
        const canvasElement = document.createElement('canvas');
        canvasElement.id = canvasId;
        canvasElement.width = this.size.width;
        canvasElement.height = this.size.height;
        canvasElement.style.width = "100%";

        // clear container
        canvasHolder && canvasHolder.replaceChildren(canvasElement);

        this.elemtRef = canvasElement;
        this.canvas2D = canvasElement.getContext('2d')!;
        this.canvasPosition = canvasElement.getBoundingClientRect();
        this.mousePosition = {
            x: 0,
            y: 0
        };

        this.mouseMoveHook = null;
        this.clickHook = null;

        // mouse event... make sure updated position
        canvasElement.addEventListener('mousemove', (e) => {
            this.updateMousePosition(e);
            if (this.mouseMoveHook) {
                this.mouseMoveHook();
            }
        });

        // click event...
        canvasElement.addEventListener('click', (e) => {
            this.updateMousePosition(e);
            if (this.clickHook) {
                this.clickHook();
            }
        });
    };

    switchCanvasContainer(canvasHolder: HTMLElement) {
        canvasHolder.replaceChildren(this.elemtRef);
        this.containerRef = canvasHolder;
    };

    /** 留意: 建议让前面的 ACOArtist 进含自动 repaint 的大小调整 */
    _resizeCanvas(width: number, height: number, windowPixelDeviceRatio = 1) {
        this.size = {
            width,
            height
        };
        this.elemtRef.width = width;
        this.elemtRef.height = height;
        this.devicePixelRatio = windowPixelDeviceRatio;
    };

    // onClick(fn: () => void) { this.clickHook = fn };
    // onMouseMove(fn: () => void) { this.mouseMoveHook = fn };

    updateMousePosition(e: MouseEvent) {
        // update mouse first
        this.canvasPosition = this.elemtRef.getBoundingClientRect();

        let mouseInnerX = e.clientX - this.canvasPosition.left;
        let mouseInnerY = e.clientY - this.canvasPosition.top;

        let widthScale = this.elemtRef.clientWidth / this.size.width;
        let heightScale = this.elemtRef.clientHeight / this.size.height;

        this.mousePosition = {
            x: Math.floor(mouseInnerX / widthScale),
            y: Math.floor(mouseInnerY / heightScale)
        };
    }

    clear() {
        this.canvas2D.clearRect(0, 0, this.size.width, this.size.height);
    };

    drawLine(fromX: number, fromY: number, toX: number, toY: number, 
        config: Partial<{ color: string; alpha: number; lineWidth: number; fitPixelRatio: boolean; }> = {}) {
        const params = {
            color: '#000',
            alpha: 1,
            lineWidth: 1,
            fitPixelRatio: true,
            ...config,
        };

        if (params.fitPixelRatio) {
            params.lineWidth *= this.devicePixelRatio;
        }


        this.canvas2D.shadowBlur = 0;
        this.canvas2D.globalAlpha = params.alpha;
        this.canvas2D.strokeStyle = params.color;
        this.canvas2D.lineWidth = params.lineWidth;
        this.canvas2D.beginPath();  // start new path
        this.canvas2D.moveTo(fromX, fromY); // move pen
        this.canvas2D.lineTo(toX, toY);     // draw line
        this.canvas2D.stroke();     // render the path
    };

    drawCircle(x: number, y: number, 
        config: Partial<{ fill: string | CanvasGradient | CanvasPattern; alpha: number; radius: number; fitPixelRatio: boolean; }> = {}) {
        const params = {
            radius: 6,
            fill: '#000',
            alpha: 1,
            fitPixelRatio: true,
            ...config,
        };

        if (params.fitPixelRatio) {
            params.radius *= this.devicePixelRatio;
        }

        this.canvas2D.shadowColor = '#666';
        this.canvas2D.shadowBlur = params.fitPixelRatio ? 30 : 15;
        this.canvas2D.shadowOffsetX = 0;
        this.canvas2D.shadowOffsetY = 0;

        this.canvas2D.globalAlpha = params.alpha;
        this.canvas2D.fillStyle = params.fill;
        
        this.canvas2D.beginPath();
        this.canvas2D.arc(x, y, params.radius, 0, 2 * Math.PI);
        this.canvas2D.fill();
    };

    drawRectangle(x: number, y: number, w: number, h: number,
        config: Partial<{ fill: string | CanvasGradient | CanvasPattern; alpha: number; fitPixelRatio: boolean; }> = {}) {
            const params = {
                fill: '#000',
                alpha: 1,
                fitPixelRatio: true,
                ...config,
            };

            this.canvas2D.shadowBlur = 0;
            this.canvas2D.globalAlpha = params.alpha;
            this.canvas2D.fillStyle = params.fill;
            this.canvas2D.fillRect(x, y, w, h);
    };
};

export default CanvasMain;