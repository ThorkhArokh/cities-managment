import { logger } from "./customLog.js"
import { MODULE_ID, FLAG_KEY } from "./constants.js"
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
            j.getFlag(MODULE_ID, FLAG_KEY) !== undefined
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
        return journalEntry.getFlag(MODULE_ID, FLAG_KEY);
    }

    // Création
    static async createCity(name) {
        const dto = new CityDto(name);
        const journal = await JournalEntry.create({
            name: dto.name,
            flags: {
                [MODULE_ID]: {
                    [FLAG_KEY]: dto
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
        await journalEntry.unsetFlag(MODULE_ID, FLAG_KEY);
        await journalEntry.setFlag(
            MODULE_ID,
            FLAG_KEY,
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