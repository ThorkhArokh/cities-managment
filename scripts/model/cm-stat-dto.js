export class StatDto {
    id;
    label;
    base;
    bonus;
    malus;
    rollFormula;

    constructor(id, label, base, bonus, malus, rollFormula) {
        this.id = id;
        this.label = label;
        this.base = base ?? 0;
        this.bonus = bonus ?? 0;
        this.malus = malus ?? 0;
        this.rollFormula = rollFormula
    }

    toObject() {
        return { 
            id: this.id, 
            label: this.label, 
            base: this.base, 
            bonus: this.bonus,
            malus: this.malus,
            rollFormula: this.rollFormula
        };
    }
}