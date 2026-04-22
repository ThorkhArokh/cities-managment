class FinanceEntryType {
    constructor(key, label, icon) {
        this.key = key;
        this.label = label;
        this.icon = icon;
    }

    static fromData(data) {
        if (data instanceof FinanceEntryType) {
            return data;
        }

        if (Object.hasOwn(data, "key") && Object.hasOwn(data, "label") && Object.hasOwn(data, "icon")) {
            return new FinanceEntryType(data.key, data.label, data.icon);
        } else {
            return this.fromKey(data)
        }
    }

    static fromKey(key) {
        var type;
        switch (key) {
            case financeEntryTypes.income.key:
                type = new FinanceEntryType("income", "CM.app.city.tab.finances.entry.types.income", "fa-solid fa-arrow-trend-up");
                break;
            case financeEntryTypes.expense.key:
                type = new FinanceEntryType("expense", "CM.app.city.tab.finances.entry.types.expense", "fa-solid fa-arrow-trend-down");
                break;
            default:
                ui.notifications.warn(game.i18n.localize("Unkown finance entry type"));
                return
        }

        return type;
    }
}

export const financeEntryTypes = {
    income: new FinanceEntryType("income", "CM.app.city.tab.finances.entry.types.income", "fa-solid fa-arrow-trend-up"),
    expense: new FinanceEntryType("expense", "CM.app.city.tab.finances.entry.types.expense", "fa-solid fa-arrow-trend-down")
}

export class FinanceEntryDto {
    id;
    label;
    type;
    value;

    constructor(id, label, type, value) {
        this.id = id;
        this.label = label?.trim();
        this.type = FinanceEntryType.fromData(type);
        this.value = Number(value) || 0;
    }

    static fromData(data) {
        return new FinanceEntryDto(data.id, data.label, data.type, data.value)
    }
}