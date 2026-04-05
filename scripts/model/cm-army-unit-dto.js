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
        this.img = img ?? "icons/svg/mystery-man.svg";
        this.role = role;
        this.nbr = Number(nbr) || 1;
        this.cost = Number(cost) || 0;
    }

}