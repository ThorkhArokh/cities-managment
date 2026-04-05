export class BuildingDto {
    id;
    uuid;
    name;
    img;
    nbr;
    price;
    cost;

    constructor(id, uuid, name, img) {
        this.id = id;
        this.uuid = uuid;
        this.name = name;
        this.img = img;
        this.nbr = 1;
        this.cost = 0;
        this.price = 0;
    }

}