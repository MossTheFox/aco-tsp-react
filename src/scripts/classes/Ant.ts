import { ACOConfig } from "./AntColony";
import City from "./City";
import Graph from "./Graph";

/** 记录路程信息 */
class Tour {
    private _graph: Graph;
    private _distance: number | null;

    cities: City[];

    /** 获取此路程的全程距离 */
    public get distance() {
        if (this._distance === null) {
            this._distance = 0;
            for (let i = 0; i < this.cities.length; i++) {
                let fromCity = this.cities[i];
                let toCity = this.cities[(i + 1) % this.cities.length];
                let edge = this._graph.getEdge(fromCity, toCity);
                if (!edge) {
                    throw new Error(`Graph missing an edge for cities: ${fromCity}, ${toCity}`);
                }
                this._distance += edge?.distance ?? 0;
            }
        }
        return this._distance;
    };

    constructor(graph: Graph) {
        this._graph = graph;
        this.cities = [];
        this._distance = null;
    };

    addCity(city: City) {
        this._distance = null;
        this.cities.push(city);
    };

    contains(city: City) {
        for (const c of this.cities) {
            if (c.toString() === city.toString()) return true;
        }
        return false;
    };

    size() {
        return this.cities.length;
    };
};

class Ant {
    acoConfig: ACOConfig;

    private _graph: Graph;

    tour: Tour | null;

    private _currentCity: City | null;

    constructor(graph: Graph, acoConfig: ACOConfig) {
        this._graph = graph;
        this.acoConfig = acoConfig;

        this.tour = null;
        this._currentCity = null;
    };

    reset() { this.tour = null; };

    init() {
        this.tour = new Tour(this._graph);
        // 随机开始位置
        let randomBeginCityIndex = Math.floor(Math.random() * this._graph.size());
        this._currentCity = this._graph.cities[randomBeginCityIndex];
        this.tour.addCity(this._currentCity);
    };

    /**
     * 根据 信息素 和 启发值 (即距离) 来决定下一步应该怎么走。
     * 采用轮盘赌选择，故有一定随机性的同时会倾向于选择高权重的方位。
     */
    makeNextMove() {
        if (!this.tour) this.init();

        // 这里是一段典型的 roulette-wheel-style 选择过程：

        /** 累积概率 */
        let rouletteWheel = 0;
        /** 此变量是所有的 state, 此处就是 city */
        const cities = this._graph.cities;

        /** 记录每个候选城市的权重 (即，每个候选状态的被选中概率) */
        const cityProbabilities: Map<string, number> = new Map();
        for (const city of cities) {
            if (!this.tour?.contains(city)) {
                let edge = this._graph.getEdge(this._currentCity!, city)!;
                /** 信息素的最终权重 */
                let finalPheromoneWeight = Math.pow(edge.pheromone, this.acoConfig.alpha);
                /** 启发值的权重 (距离越小越好，故取倒数后再求幂) */
                let finalHeuristicWeight = Math.pow(1 / edge.distance, this.acoConfig.beta);

                let finalWeight = finalPheromoneWeight * finalHeuristicWeight;

                // 记录此个体的权重
                cityProbabilities.set(city.toString(), finalWeight);

                // 加到累积概率上面
                rouletteWheel += finalWeight;
            }
        }

        /** 取目标点 */
        let wheelTarget = rouletteWheel * Math.random();

        /** 用于寻找与目标点最接近的下一个 state (这里就是 city) */
        let wheelPosition = 0;

        // 选择最终的新 state, 即下一步要走的城市
        for (const city of cities) {
            if (!this.tour?.contains(city)) {
                wheelPosition += cityProbabilities.get(city.toString()) ?? 0;
                if (wheelPosition >= wheelTarget) {
                    // 选中。
                    this._currentCity = city;
                    this.tour?.addCity(city);
                    return;
                }
            }
        }
    };

    isFound() {
        if (!this.tour) return false;
        return this.tour.size() === this._graph.cities.length;
    };

    /** 重置并开始寻找路线 */
    run() {
        this.reset();
        while (!this.isFound()) {
            this.makeNextMove();
        }
    };

    /** 释放信息素 (在完成寻路之后释放) */
    depositPheromone(weight = 1) {
        if (!this.tour) return;

        // 最终在每条边释放的信息素 (权重 * 距离的倒数，保证距离越短释放的会越多)
        let pheromoneToProduce = this.acoConfig.q * weight / this.tour.distance;

        // 将信息素更新到每条边上
        for (let i = 0; i < this.tour.cities.length; i++) {
            let fromCity = this.tour.cities[i];
            let toCity = this.tour.cities[(i + 1) % this.tour.cities.length];
            let edge = this._graph.getEdge(fromCity, toCity);
            if (!edge) {
                throw new Error(`Graph Missing edge connecting ${fromCity} to ${toCity}.`);
            }
            edge.pheromone += pheromoneToProduce;
        }
    }
};

export default Ant;