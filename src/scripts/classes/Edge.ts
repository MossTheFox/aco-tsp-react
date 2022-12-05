import City from "./City";

/**
 * 边，连接两个城市，同时会记录信息素的值
 */
class Edge {
    private _cityA: City;
    private _cityB: City;
    private _distance: number;

    public initPheromone: number;
    public pheromone: number;

    public get cityA() { return this._cityA; };
    public get cityB() { return this._cityB; };
    public get distance() { return this._distance; };


    constructor(cityA: City, cityB: City) {
        this._cityA = cityA;
        this._cityB = cityB;
        this.initPheromone = 1;
        this.pheromone = this.initPheromone;

        this._distance = Math.sqrt(
            Math.pow(cityA.x - cityB.x, 2)
            + Math.pow(cityA.y - cityB.y, 2)
        );
    };

    contains(city: City) {
        return (this.cityA.x === city.x && this.cityA.y === city.y)
            || (this.cityB.x === city.x && this.cityB.y === city.y);
    };

    resetPheromone() {
        this.pheromone = this.initPheromone;
    };

};

export default Edge;