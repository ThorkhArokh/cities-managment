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
    owner;
    isVisibleForPlayer;

    constructor(id, uuid, name, img, nbr, cost, price, owner) {
        this.id = id;
        this.uuid = uuid;
        this.name = name;
        this.img = img ?? "icons/environment/settlement/house-city.webp";
        this.nbr = nbr ?? 1;
        this.cost = cost ?? 0;
        this.price = price ?? 0;
        this.description = "";
        this.owner = owner ?? {};
        this.isVisibleForPlayer = false;
    }

    getSheet() {
        return new BuildingItemSheet(this)
    }

    static fromData(data) {
        var building = new BuildingDto(data.id, data.uuid, data.name, data.img, data.nbr, data.cost, data.price, data.owner);
        building.description = data.description;
        building.isVisibleForPlayer = data.isVisibleForPlayer;
        return building;
    }
}