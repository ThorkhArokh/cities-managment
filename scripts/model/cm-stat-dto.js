export class StatDto {
    id;
    label;
    base;
    bonus;
    malus;
    roll;

    constructor(id, label, base, bonus, malus, rollFormula) {
        this.id = id;
        this.label = label;
        this.base = base ?? 0;
        this.bonus = bonus ?? 0;
        this.malus = malus ?? 0;
        this.rollFormula = rollFormula
    }

}