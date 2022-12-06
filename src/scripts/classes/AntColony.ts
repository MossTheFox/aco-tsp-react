import Ant from "./Ant";
import Graph from "./Graph";

export type ACOConfig = {

    /** 类型: 最大最小准则 | 精英策略 | 普通
     * 
     * 注: 
     * - 在最大最小准则中，只有当前迭代的最优解的蚂蚁可以释放信息素*;
     *   - 同时，超出最大最小范围限制的信息素会被限制在区间内，避免陷入局部最优解
     * - 采用精英策略，会让最优解的蚂蚁释放额外的信息素。
     * 
     * \[\*\] 实际上会这样设计：前一部分迭代是当前局部最优解蚂蚁释放，后面一部分则只有全局最优可以释放。
     *  这个分界点位置... 目前先取 0.75 (TODO: 教材上似乎有点区别，但看不懂)
     */
    type: 'maxmin' | 'elitist' | 'acs';
    /** 蚁群数量 */
    colonySize: number;
    /** α, 信息素的指数 作为权重 */
    alpha: number;
    /** β, 启发值的指数 作为权重 */
    beta: number;
    /** ρ, 信息素蒸发率 (for Global Pheromone Update), 0 ~ 1 */
    rho: number;
    /** Q, 信息素释放的强度 (Pheromone Deposit Weight)，默认 1 */
    q: number;
    /** 每个边上的初始信息素 (默认情况可以跟随 Q) */
    initialPheromone: number;

    /** (Elitist Only) 精英个体 (Global Best) 可以额外释放的信息素权重 (即倍数) */
    elitistWeight: number;

    /** (Max-Min Only) 最小信息素保留的倍数
     *  (注: 最小信息素 = 这个倍率 * 最大信息素)
     *  (注2: 最大信息素 = 信息素强度 Q / 最短距离)
     */
    minPheromoneScalingFactor: number;

    /** 迭代次数 */
    maxIterations: number;
};

export const defaultACOConfig: ACOConfig = {
    type: 'maxmin',
    colonySize: 30,
    alpha: 1,
    beta: 3,
    rho: 0.1,
    q: 1,
    initialPheromone: 1,
    elitistWeight: 2,
    minPheromoneScalingFactor: 0.001,
    maxIterations: 200
} as const;

class AntColony {
    acoConfig: ACOConfig;

    public graph: Graph;

    private _colony: Ant[];
    public get colony() { return this._colony; };

    /** 当前迭代 */
    private _iteration: number;
    public get currentIteration() { return this._iteration; };

    /** 这两个值在 Min-Max 模式下会用 */
    private _minPheromone: number | null;
    private _maxPheromone: number | null;

    /** 当前迭代最优 */
    private _iterationBest: Ant | null;
    /** 全局最优 */
    private _globalBest: Ant | null;

    constructor(acoConfig: ACOConfig) {
        this.acoConfig = acoConfig;

        this._colony = [];
        this.graph = new Graph();

        this._iteration = 0;
        this._minPheromone = null;
        this._maxPheromone = null;
        this._iterationBest = null;
        this._globalBest = null;

        // 召唤蚂蚁
        this._createAnts();
    };

    private _createAnts() {
        this._colony = [];
        for (let i = 0; i < this.acoConfig.colonySize; i++) {
            this._colony.push(new Ant(this.graph, this.acoConfig));
        }
    };

    config(newConfig: Partial<ACOConfig>) {
        this.acoConfig = {
            ...this.acoConfig,
            ...newConfig
        };
    };

    reset() {
        this._iteration = 0;
        this._globalBest = null;
        this.resetAnts();
        this.setInitialPhoemore(this.acoConfig.initialPheromone);
        this.graph.resetPheromone();
    };

    /** 每次迭代开始时，重置蚁群 */
    resetAnts() {
        this._createAnts();
        this._iterationBest = null;
    };

    setInitialPhoemore(initialPheromone: number) {
        for (const edge of this.graph.edges) {
            edge[1].pheromone = initialPheromone;
        }
    };

    get ready() {
        return this.graph.size() >= 2;
    };

    run() {
        if (!this.ready) return;
        this._iteration = 0;
        while (this._iteration < this.acoConfig.maxIterations) {
            this.step();
        }
    };

    step() {
        if (!this.ready || this._iteration > this.acoConfig.maxIterations) return;

        this.resetAnts();

        for (const ant of this._colony) {
            ant.run();
        }

        // 记录全局最佳
        // ...然后更新信息素
        this.getGlobalBest();
        this.updatePheromone();

        this._iteration++;
    };

    getIterationBest() {
        if (this._colony.length === 0 || this._colony[0].tour === null) {
            return null;
        }

        if (this._iterationBest === null) {
            let bestAnt = this._colony[0];

            // 取路径最小的蚂蚁作为当前迭代的局部最优
            // 要排序的话就这么写: this._colony.sort((a, b) => a.tour!.distance - b.tour!.distance);
            for (const ant of this._colony) {
                if (bestAnt.tour!.distance > ant.tour!.distance) {
                    bestAnt = ant;
                }
            }
            this._iterationBest = bestAnt;
        }
        return this._iterationBest;
    };

    /**
     * 留意: 精英个体是会被保留下来的
     */
    getGlobalBest() {
        const bestAnt = this.getIterationBest();
        if (!bestAnt) return;
        if (this._globalBest === null) {
            this._globalBest = bestAnt;
        } else {
            if (this._globalBest.tour!.distance > bestAnt.tour!.distance) {
                this._globalBest = bestAnt;
            }
        }
        return this._globalBest;
    };

    /** 根据不同的策略来更新信息素 */
    updatePheromone() {
        if (this._colony[0].tour === null) return;  // 未运行
        const edges = this.graph.edges;
        // 全局: 信息素挥发
        for (const [_, edge] of edges) {
            edge.pheromone *= 1 - this.acoConfig.rho;
        }

        switch (this.acoConfig.type) {
            case 'acs':
                // 正常更新信息素，然后结束
                for (const ant of this._colony) {
                    ant.depositPheromone();
                }
                break;

            case 'elitist':
                // 正常更新，但是精英会释放额外的信息素
                for (const ant of this._colony) {
                    ant.depositPheromone();
                }
                this.getGlobalBest()!.depositPheromone(this.acoConfig.elitistWeight);
                break;

            case 'maxmin':
                // 这里有一个策略: 前大部分迭代以局部最优来负责释放信息素，后面换做全局最优
                let best: Ant;
                if (this._iteration / this.acoConfig.maxIterations <= 0.75) {
                    best = this.getIterationBest()!;
                } else {
                    best = this.getGlobalBest()!;
                }
                /** 允许的最强信息素 👇 (上限) */
                this._maxPheromone = this.acoConfig.q / best.tour!.distance;
                /** 保持的最低信息素 (下限) */
                this._minPheromone = this._maxPheromone * this.acoConfig.minPheromoneScalingFactor;

                // 释放信息素
                best.depositPheromone();

                // 将有着超出界限的信息素大小的边，限制一下
                for (const [_, edge] of this.graph.edges) {
                    if (edge.pheromone > this._maxPheromone) edge.pheromone = this._maxPheromone;
                    if (edge.pheromone < this._minPheromone) edge.pheromone = this._minPheromone;
                }
                break;
        }
    };


};

export default AntColony;