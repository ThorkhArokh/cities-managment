import { logger } from "./cm-customLog.js"
import { MODULE_ID, FLAG_KEY_CITY_DATAS } from "./cm-constants.js"
import { CityDto } from "../model/cm-city-dto.js"

/**
 * Manage cities datas persistence
 */
export class CmCitiesJournalDataStore {
    /**
     * Get all cities (JournalEntries tagged)
     * @returns cities array
     */
    static getAllCities() {
        return game.journal.filter(j =>
            j.getFlag(MODULE_ID, FLAG_KEY_CITY_DATAS) !== undefined
        );
    }

    /**
     * Get Foundry journal document by id (for ownership etc.)
     * @param {*} id the document id
     * @returns journal document
     */
    static getCityById(id) {
        return game.journal.get(id);
    }

    /**
     * Get city datas from journal document
     * @param {*} journalEntry the journal document
     * @returns city datas
     */
    static getCityData(journalEntry) {
        return journalEntry.getFlag(MODULE_ID, FLAG_KEY_CITY_DATAS);
    }

    // Création
    static async createCity(name, folderId) {
        const dto = new CityDto(name);
        logger.debug("CmCitiesJournalDataStore | createCity", name, dto)
        const journal = await JournalEntry.create({
            name: dto.name,
            folder: folderId,
            flags: {
                [MODULE_ID]: {
                    [FLAG_KEY_CITY_DATAS]: {...dto}
                }
            }
        });
        return journal;
    }

    /**
     * Update journal document flags with city datas
     * @param {*} journalEntry the journal document
     * @param {*} cityDto city datas
     */
    static async updateCity(journalEntry, cityDto) {
        logger.debug("Update city", journalEntry, cityDto)
        await journalEntry.update({ name: cityDto.name });
        await journalEntry.unsetFlag(MODULE_ID, FLAG_KEY_CITY_DATAS);
        await journalEntry.setFlag(
            MODULE_ID,
            FLAG_KEY_CITY_DATAS,
            { ...cityDto }
        );
        logger.debug("Updated city", this.getCityById(journalEntry.id))
    }

    /**
     * Delete a city by id
     * @param {*} id the city's id
     */
    static async deleteCity(id) {
        const journal = game.journal.get(id);
        await journal?.delete();
    }
}