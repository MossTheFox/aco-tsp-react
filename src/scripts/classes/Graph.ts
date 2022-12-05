import City from "./City";
import Edge from "./Edge";

/**
 * 图，由 City 与 Edge 组成。
 * Edges 会由 Map 来记录。
 */
class Graph {
    cities: City[];
    /** 由 两个 City 对象的 toString 方法返回的字符串的拼合 作为 Map 的键。 
     * @example edges.get('1, 2 | 3, 4') -> edge
     * @example edges.set(`${cityA} | ${cityB}`, new Edge(cityA, cityB));
    */
    edges: Map<string, Edge>;

    constructor() {
        this.cities = [];
        this.edges = new Map();
    };

    addEdge(cityA: City, cityB: City) {
        this.edges.set(`${cityA} | ${cityB}`, new Edge(cityA, cityB));
    };

    getEdge(cityA: City, cityB: City) {
        return this.edges.get(`${cityA} | ${cityB}`) || this.edges.get(`${cityB} | ${cityA}`);
    };

    addCity(x: number, y: number) {
        this.cities.push(new City(x, y));
    };

    /** 根据 City 列表来生成 Edges */
    createEdges() {
        this.edges.clear();
        for (let i = 0; i < this.cities.length; i++) {
            for (let j = i + 1; j < this.cities.length; j++) {
                this.addEdge(this.cities[i], this.cities[j]);
            }
        }
    };

    resetPheromone() {
        for (const edge of this.edges) {
            edge[1].resetPheromone();
        }
    };

    size() {
        return this.cities.length;
    };

    clear() {
        this.cities = [];
        this.edges = new Map();
    };

};

export default Graph;

