/**
 * 城市，作为图的节点。属性只包含位置信息。
 */
class City {
    private _x: number;
    private _y: number;

    public get x() {
        return this._x;
    }

    public get y() {
        return this._y;
    }

    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    };

    toString() {
        return `${this.x}, ${this.y}`;
    };

    isEqual(city: City) {
        return this.x === city.x && this.y === city.y;
    };
};

export default City;