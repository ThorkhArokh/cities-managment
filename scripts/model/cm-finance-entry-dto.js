class FinanceEntryType {
    constructor(key, label, icon) {
        this.key = key;
        this.label = label;
        this.icon = icon;
    }
}

export const financeEntryTypes = {
    income: new FinanceEntryType("income", "CM.app.tab.finances.entry.types.income", "fa-solid fa-plus"),
    expense: new FinanceEntryType("expense", "CM.app.tab.finances.entry.types.expense", "fa-solid fa-minus")
}

export class FinanceEntryDto {
    id;
    label;
    type;
    value;

    constructor(id, label, type, value) {
        this.id = id;
        this.label = label.trim();
        this.type = this.getEntryTypeFromKey(type);
        this.value = Number(value) || 0;
    }

    getEntryTypeFromKey(key) {
        if (key instanceof FinanceEntryType) {
            return key;
        }

        var type;
        switch (key) {
            case financeEntryTypes.income.key:
                type = new FinanceEntryType("income", "CM.app.tab.finances.entry.types.income", "fa-solid fa-plus");
                break;
            case financeEntryTypes.expense.key:
                type = new FinanceEntryType("expense", "CM.app.tab.finances.entry.types.expense", "fa-solid fa-minus");
                break;
            default:
                ui.notifications.warn(game.i18n.localize("Unkown finance entry type"));
                return
        }

        return type;
    }
}