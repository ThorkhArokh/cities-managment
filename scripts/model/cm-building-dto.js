import { BuildingItemSheet } from "../items/cm-building-sheet.js"

export class BuildingDto {
    id;
    uuid;
    name;
    img;
    nbr;
    price;
    cost;
    description;

    constructor(id, uuid, name, img) {
        this.id = id;
        this.uuid = uuid;
        this.name = name;
        this.img = img ?? "icons/environment/settlement/house-city.webp";
        this.nbr = 1;
        this.cost = 0;
        this.price = 0;
        this.description = "";
    }

    getSheet() {
        return new BuildingItemSheet(this)
    }

    static fromData(data) {
        var building = new BuildingDto(data.id, data.uuid, data.name, data.img);
        building.nbr = data.nbr;
        building.cost = data.cost;
        building.price = data.price;
        building.description = data.description;
        return building;
    }
}