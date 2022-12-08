import Ant from "./Ant";
import AntColony from "./AntColony";
import CanvasMain from "./CanvasMain";
import City from "./City";
import Edge from "./Edge";

class CanvasArtist {
    canvasMain: CanvasMain;
    ac: AntColony;


    private _animationInterval: number | null;
    antAnimationFrames: number;

    /** 当准备开始、或是一次迭代完成后，需要触发的 Hook */
    iterationHook: (() => void) | null;

    forceStopHook: (() => void) | null;

    private _paused: boolean;
    autoGoOn: boolean;

    constructor(ac: AntColony, canvasMain: CanvasMain) {
        this.canvasMain = canvasMain;
        this.ac = ac;
        this._animationInterval = null;
        this.antAnimationFrames = 8;

        this.iterationHook = null;
        this.forceStopHook = null;
        this._paused = false;
        this.autoGoOn = true;

        canvasMain.clickHook = this.click.bind(this);
    };

    resize(size: Partial<{ width: number; height: number; }>, windowPixelDeviceRatio: number = window.devicePixelRatio) {
        const _size = {
            ...this.canvasMain.size,
            ...size,
        };
        const { width, height } = _size;
        this.canvasMain._resizeCanvas(width, height, windowPixelDeviceRatio);
        this.draw();
    };

    click() {
        const cities = this.ac.graph.cities;
        let e = this.canvasMain.mousePosition;

        // 忽略小于 25px 距离的的新建点操作
        for (const city of cities) {
            let diff = Math.abs(city.x - e.x) + Math.abs(city.y - e.y);
            if (diff < 25 * this.canvasMain.devicePixelRatio) {
                return;
            }
        }

        this.ac.graph.addCity(e.x, e.y);
        this.ac.graph.createEdges();
        this.ac.reset();

        // end it...
        this._animationInterval && clearInterval(this._animationInterval);

        // handle ui callback
        this.forceStopHook && this.forceStopHook();

        this.draw();
    };

    draw() {
        this.canvasMain.clear();
        this._drawBackground();
        this._drawEdges();
        this._drawNodes();
        this._drawCurrentBest();
    };

    private _drawBackground() {
        // let gradient = this.canvasMain.canvas2D.createLinearGradient(
        //     0, 0, 0, this.canvasMain.size.height);
        // gradient.addColorStop(0, '#ededed');
        // gradient.addColorStop(0.4, '#ffffff');
        // gradient.addColorStop(1, '#ebebeb');

        this.canvasMain.drawRectangle(0, 0, this.canvasMain.size.width, this.canvasMain.size.height, {
            // fill: gradient
            fill: '#fff'
        });

        // 画网格, 25px ?
        // 水平
        let horizonBreakPoints = Math.floor(this.canvasMain.size.height / 25);
        let verticalBreakPoints = Math.floor(this.canvasMain.size.width / 25);

        for (let i = 0; i <= verticalBreakPoints; i++) {
            // draw
            this.canvasMain.drawLine(i * 25, 0, i * 25, this.canvasMain.size.height, {
                color: '#e5e5e5',
                lineWidth: 1
            });
        }

        for (let i = 0; i <= horizonBreakPoints; i++) {
            // draw
            this.canvasMain.drawLine(0, i * 25, this.canvasMain.size.width, i * 25, {
                color: '#e5e5e5',
                lineWidth: 1
            });
        }

    };

    private _drawEdges() {
        const edges = this.ac.graph.edges;
        let totalPheromone = 0;
        for (const [_, edge] of edges) {
            totalPheromone += edge.pheromone;
        }

        for (const [_, edge] of edges) {
            let alpha = 0.2;
            let width = 1;
            if (this.ac.currentIteration !== 0) {
                // 对于已经开始运行了的情况，根据每个边的信息素来决定线条样式
                width = Math.ceil(
                    // 进入 0 ~ 1 区间
                    edge.pheromone / totalPheromone * this.ac.graph.size()
                    // 然后加粗 6 倍…… 显然这个数字是要稍微试出来的
                    * 6
                );
                alpha = (edge.pheromone / totalPheromone * this.ac.graph.size())
                    + 0.03;     // 保留最低不透明度
                if (alpha > 1) {
                    alpha = 1;
                }
            }

            this.canvasMain.drawLine(edge.cityA.x, edge.cityA.y,
                edge.cityB.x, edge.cityB.y, {
                alpha,
                lineWidth: width,
                color: '#009dff'
            });
        }
    };

    private _drawNodes() {
        const nodes = this.ac.graph.cities;
        for (const node of nodes) {
            this.canvasMain.drawCircle(node.x, node.y, {
                alpha: 0.8,
                radius: 5
            });
        }
    };

    private _drawCurrentBest() {
        const cities = this.ac.getIterationBest()?.tour?.cities;
        if (!cities) {
            return;
        }

        for (let i = 0; i < cities.length; i++) {
            const nextCity = cities[(i + 1) % cities.length];
            this.canvasMain.drawLine(
                cities[i].x, cities[i].y,
                nextCity.x, nextCity.y,
                {
                    alpha: 0.9,
                    color: '#38a13b',
                    lineWidth: 3
                }
            );
        }
    };

    stop() {
        this._animationInterval && clearInterval(this._animationInterval);
        this.ac.reset();
        this.draw();
    };

    clearGraph() {
        this._animationInterval && clearInterval(this._animationInterval);
        this.ac.graph.clear();
        this.ac.reset();
        this.draw();
    };

    run() {
        if (!this.ac.ready) {
            return;
        }

        this.iterationHook && this.iterationHook();
        this._animationInterval && clearInterval(this._animationInterval);

        this.ac.reset();
        this.step();
    };

    /** 暂停，返回一个包含选择是步进方法与继续进行方法的对象 */
    pause() {
        this._paused = true;
        this._animationInterval && clearInterval(this._animationInterval);
        this.draw();
        return ({
            step: () => this.step(),
            goOn: () => {
                this._paused = false;
                this.step();
            }
        });
    };

    getStatus() {
        return {
            finished: this.ac.currentIteration >= this.ac.acoConfig.maxIterations,
            paused: this._paused,
            goOn: () => {
                this._paused = false;
                this.step();
            },
            currentIteration: this.ac.currentIteration,
            maxIterations: this.ac.acoConfig.maxIterations,
            globalBestDistance: this.ac.getGlobalBest()?.tour?.distance ?? -1,
            globalBestFromIteration: this.ac.globalBestFromIteration ?? -1,
            currentIterationBestDistance: this.ac.getIterationBest()?.tour?.distance ?? -1,
        };
    };

    step(repaintOnStepEnd = false) {
        // 已完成...
        if (this.ac.currentIteration >= this.ac.acoConfig.maxIterations) {
            this.draw();
            this.ac.resetAnts();
            return;
        }

        // 运行中
        this.ac.step();
        this.iterationHook && this.iterationHook();
        if (repaintOnStepEnd) {
            this.draw();
        }
        if (this.autoGoOn) {
            this._animateAnts();
        }
    };

    _drawAnt(x: number, y: number, alpha = 0.25) {
        this.canvasMain.drawRectangle(x - 2, y - 2, 4, 4, { alpha });
    };

    _animateAnts() {
        // 当前帧 (0 ~ this.antAnimationFrames - 1)
        let keyframesLength = 0;
        this._animationInterval = setInterval(() => {
            // 铺底子 (完整的图)
            this.draw();
            const ants = this.ac.colony;
            for (const ant of ants) {
                // 绘制中间帧的蚂蚁
                // ...
                this._drawAntAnimation(ant, keyframesLength);
            }
            keyframesLength++;
            if (keyframesLength > this.antAnimationFrames) {
                this._animationInterval && clearInterval(this._animationInterval);
                // 自动继续
                if (this.autoGoOn) {
                    this.step();
                }
            }
        }, 16.66);
    };

    _drawAntAnimation(ant: Ant, currentFrame: number) {
        if (!ant.tour) return;
        // 简化的可视化为：只绘制每个蚂蚁走的第一步
        // 如果要绘制所有蚂蚁，会有些慢，以及要计算帧……
        let tourFullDistance = ant.tour.distance;
        let currentAnimationPercentage = currentFrame / this.antAnimationFrames;
        /** 蚂蚁在整条道路上的位置 */
        let currentAntPosition = tourFullDistance * currentAnimationPercentage;

        // 找到当前的位置...
        let selectedEdgeEndPoints: [City, City] | null = null;
        let selectedEdge: Edge | null = null;
        let distanceMark = 0;
        let distanceTillEdgeStartCity = 0;
        for (let i = 0; i < ant.tour.size(); i++) {
            selectedEdgeEndPoints = [ant.tour.cities[i], ant.tour.cities[(i + 1) % ant.tour.size()]];
            const edge = this.ac.graph.getEdge(selectedEdgeEndPoints[0], selectedEdgeEndPoints[1]);
            if (!edge) {
                throw new Error('Graph Missing Edge.');
            }
            selectedEdge = edge;

            distanceTillEdgeStartCity = distanceMark;
            distanceMark += edge.distance;
            if (distanceMark >= currentAntPosition) {
                break;
            }
        }
        if (!selectedEdge || !selectedEdgeEndPoints) return;

        // 在这条边上画蚂蚁
        let ratioOfTheEdge = (currentAntPosition - distanceTillEdgeStartCity) / selectedEdge.distance;
        const [fromCity, toCity] = selectedEdgeEndPoints;

        let xOffset = (toCity.x - fromCity.x) * ratioOfTheEdge;
        let yOffset = (toCity.y - fromCity.y) * ratioOfTheEdge;

        this._drawAnt(fromCity.x + xOffset, fromCity.y + yOffset);

    };



};

export default CanvasArtist;