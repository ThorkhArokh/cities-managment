export class CityDto {
    id;
    name;
    img;
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
            "pop": this._initStat("CM.app.tab.stats.population.label"),
            "dip": this._initStat("CM.app.tab.stats.diplomacy.label"),
            "mag": this._initStat("CM.app.tab.stats.managment.label"),
            "pow": this._initStat("CM.app.tab.stats.power.label"),
            "rep": this._initStat("CM.app.tab.stats.reputation.label"),
            "pro": this._initStat("CM.app.tab.stats.production.label")
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
}
