import { BuildingDto } from "./cm-building-dto.js"
import { FinanceEntryDto } from "./cm-finance-entry-dto.js"

export class CityDto {
    id;
    name;
    img;
    description;
    size;
    stats;
    buildings;
    finances;
    peoples;
    armies;
    chests;

    constructor(name) {
        this.name = name;
        this.id = foundry.utils.randomID();
        this.img = "icons/svg/city.svg";
        this.description = "";
        this.size = "city";
        this.chests = {};
        this.stats = this._defaultStats();
        this.buildings = {};
        this.finances = {
            treasury: {
                "currencies": {
                    "pp": 0,
                    "gp": 0,
                    "sp": 0,
                    "cp": 0
                }
            },
            "entries": {}
        };
        this.armies = {
            "units": {}
        };
        this.population = {
            "nbr": 0,
            "max": 0,
            "peoples": {}
        };
    }

    _defaultStats() {
        var stats = {
            "pop": this._initStat("CM.app.city.tab.stats.population.label"),
            "dip": this._initStat("CM.app.city.tab.stats.diplomacy.label"),
            "mag": this._initStat("CM.app.city.tab.stats.managment.label"),
            "pow": this._initStat("CM.app.city.tab.stats.power.label"),
            "rep": this._initStat("CM.app.city.tab.stats.reputation.label"),
            "pro": this._initStat("CM.app.city.tab.stats.production.label")
        }
        return stats;
    }

    _initStat(label) {
        return {
            "label": label,
            "base": 0,
            "bonus": 0,
            "malus": 0,
            "value": 0
        }
    }

    static fromData(data) {
        var city = new CityDto(data.name);
        city.id = data.id;
        city.img = data.img;
        city.description = data.description;
        city.size = data.size;
        city.stats = data.stats;
        // chests
        city.chests = data.chests ?? {};
        // Buildings
        city.buildings = {};
        var buildingsDatas = data.buildings ?? {}
        var mappedBuildings = Object.entries(buildingsDatas).map(([id, entry]) => BuildingDto.fromData(entry));
        mappedBuildings.forEach(entry => {
            city.buildings[entry.id] = entry
        })
        // Finances
        city.finances = { ...data.finances } ?? {};
        city.finances.entries = {}
        var financeEntries = data.finances?.entries ?? {}
        var mappedEntries = Object.entries(financeEntries).map(([id, entry]) => FinanceEntryDto.fromData(entry));
        mappedEntries.forEach(entry => {
            city.finances.entries[entry.id] = entry
        })
        // Armies
        city.armies = data.armies ?? {};
        // Population
        city.population = data.population ?? {};
        return city;
    }
}
