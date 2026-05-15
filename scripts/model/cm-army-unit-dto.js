export class ArmyUnitDto {
    id;
    uuid;
    name;
    img;
    role;
    nbr;
    cost;

    constructor(id, uuid, name, img, role, nbr, cost) {
        this.id = id;
        this.uuid = uuid;
        this.name = name;
        this.img = img ?? "icons/environment/people/commoner.webp";
        this.role = role;
        this.nbr = Number(nbr) || 1;
        this.cost = Number(cost) || 0;
    }

    toObject() {
        return { 
            id: this.id, 
            uuid: this.uuid, 
            name: this.name, 
            img: this.img,
            role: this.role,
            nbr: this.nbr,
            cost: this.cost
        };
    }
}