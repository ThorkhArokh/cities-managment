import { BuildingDto } from "./cm-building-dto.js"
import { FinanceEntryDto } from "./cm-finance-entry-dto.js"
import { StatDto } from "./cm-stat-dto.js"

export class CityDto {
    id;
    name;
    img;
    description;
    size;
    map;
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
        this.map = {};
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
        let popId = foundry.utils.randomID();
        let dipId = foundry.utils.randomID();
        let magId = foundry.utils.randomID();
        let powId = foundry.utils.randomID();
        let repId = foundry.utils.randomID();
        let proId = foundry.utils.randomID();
        var stats = {}
        stats[popId] = new StatDto(popId, "CM.app.city.tab.stats.population.label");
        stats[dipId] = new StatDto(dipId, "CM.app.city.tab.stats.diplomacy.label");
        stats[magId] = new StatDto(magId, "CM.app.city.tab.stats.managment.label");
        stats[powId] = new StatDto(powId, "CM.app.city.tab.stats.power.label");
        stats[repId] = new StatDto(repId, "CM.app.city.tab.stats.reputation.label");
        stats[proId] = new StatDto(proId, "CM.app.city.tab.stats.production.label");
        return stats;
    }

    static fromData(data) {
        var city = new CityDto(data.name);
        city.id = data.id;
        city.img = data.img;
        city.description = data.description;
        city.size = data.size;
        city.stats = data.stats;
        city.map = data.map;
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
