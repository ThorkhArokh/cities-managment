import { logger } from "./customLog.js"
import { MODULE_ID, DATAS_STORE } from "./constants.js"
import { CityDto } from "../model/cm-city-dto.js"

export class CmDataStore {

    static get() {
        return game.settings.get(MODULE_ID, DATAS_STORE);
    }

    static getCities() {
        const datastore = game.settings.get(MODULE_ID, DATAS_STORE);
        const cities = datastore.cities ?? [];
        return cities;
    }

    static getCityById(id) {
        return this.getCities().find(item => item.id === id);
    }

    static async updateCity(city) {
        if (!(city instanceof CityDto)) {
            logger.error("updateCity - Object type is not CityDto", city)
            return
        }
        var cities = this.getCities();
        const index = cities.findIndex(item => item.id === city.id);

        if (index === -1) {
            logger.error("updateCity - City not found", city)
            return
        }

        cities[index] = city;
        var datastore = this.get()
        datastore.cities = cities
        await game.settings.set(MODULE_ID, DATAS_STORE, datastore);
    }

    static async deleteCity(id) {
        var cities = this.getCities();
        const index = cities.findIndex(item => item.id === id);

        if (index === -1) {
            logger.error("deleteCity - City not found", id)
            return
        }

        cities.splice(index, 1);
        var datastore = this.get()
        datastore.cities = cities
        await game.settings.set(MODULE_ID, DATAS_STORE, datastore);
    }

    static async deleteAllCities() {
        var datastore = this.get()
        datastore.cities = []
        await game.settings.set(MODULE_ID, DATAS_STORE, datastore);
    }

    static async addCity(city) {
        if (!(city instanceof CityDto)) {
            logger.error("addCity - Object type is not CityDto", city)
            return
        }

        var cities = this.getCities();
        cities.push(city);
        var datastore = this.get()
        datastore.cities = cities
        await game.settings.set(MODULE_ID, DATAS_STORE, datastore);
    }
}