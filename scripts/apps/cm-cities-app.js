import { logger } from "../common/cm-customLog.js"
import { MODULE_ID, IS_CITY_EDIT_MODE } from "../common/cm-constants.js"
import { CmCitiesJournalDataStore } from "../common/cm-cities-journal-ds.js"
import { CityDto } from "../model/cm-city-dto.js"
import { StatDto } from "../model/cm-stat-dto.js"
import { BuildingDto } from "../model/cm-building-dto.js"
import { FinanceEntryDto, financeEntryTypes } from "../model/cm-finance-entry-dto.js"
import { ArmyUnitDto } from "../model/cm-army-unit-dto.js"
import { addArmiesUnitDialog } from "../dialogs/cm-city-add-armies-unit-dialog.js"
import { addFinanceEntryDialog } from "../dialogs/cm-city-add-finance-entry-dialog.js"
import { addBuildingDialog } from "../dialogs/cm-city-add-building-dialog.js"
import { addStatDialog } from "../dialogs/cm-city-add-stat-dialog.js"

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { DragDrop, TextEditor, FormDataExtended } = foundry.applications.ux;
const { FilePicker } = foundry.applications.apps;

export class CmCityApp extends HandlebarsApplicationMixin(ApplicationV2) {
    #dragDrop;
    #hooks = [];
    #sort = { field: null, direction: 1 };

    constructor(city, options = {}) {
        super(options);
        this.city = city;
        this.cityDatas = CityDto.fromData(CmCitiesJournalDataStore.getCityData(city));
        this.#dragDrop = this.#createDragDropHandlers();
        this.isEditable = options?.isEditable || (game.settings.get(MODULE_ID, IS_CITY_EDIT_MODE) && (game.user.isGM || city.testUserPermission(game.user, "OWNER")));
        this.isGM = game.user.isGM;
    }

    // Override title getter 
    get title() {
        logger.debug("Get window title", this.cityDatas)
        return this.cityDatas?.name ?? "CM.app.city.title";
    }

    static DEFAULT_OPTIONS = {
        id: "cm-city-app",
        tag: "form",
        form: {
            handler: CmCityApp.submitFormHandler,
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: [
            { dragSelector: null, dropSelector: "[data-drop-peoples]" },
            { dragSelector: null, dropSelector: "[data-drop-buildings]" },
            { dragSelector: null, dropSelector: "[data-drop-chests]" },
            { dragSelector: null, dropSelector: "[data-drop-units]" },
            { dragSelector: null, dropSelector: "[data-drop-map]" }
        ],
        position: {
            width: 800,
            height: 600,
            top: 150,
            left: 150,
        },
        window: {
            title: "CM.app.city.title",
            icon: "fa-solid fa-landmark",
            resizable: true,
            controls: []
        },
        actions: {
            optionEditAction: CmCityApp.#optionEditAction,
            optionGoToSettings: CmCityApp.#optionGoToSettings,
            showJournal: CmCityApp.#showJournal,
            showDetails: CmCityApp.#showDetails,
            removePeople: CmCityApp.#removePeople,
            togglePeopleView: CmCityApp.#togglePeopleView,
            removeTreasury: CmCityApp.#removeTreasury,
            toggleTreasuryView: CmCityApp.#toggleTreasuryView,
            editImage: CmCityApp.#onEditImage,
            addNewFinanceEntry: CmCityApp.#addNewFinanceEntry,
            removeFinanceEntry: CmCityApp.#removeFinanceEntry,
            addNewUnit: CmCityApp.#addNewUnit,
            editUnit: CmCityApp.#editUnit,
            removeUnit: CmCityApp.#removeUnit,
            addNewBuilding: CmCityApp.#addNewBuilding,
            editBuilding: CmCityApp.#editBuilding,
            removeBuilding: CmCityApp.#removeBuilding,
            showDetailsBuilding: CmCityApp.#showDetailsBuilding,
            toggleBuildingView: CmCityApp.#toggleBuildingView,
            addNewStat: CmCityApp.#addNewStat,
            editStat: CmCityApp.#editStat,
            removeStat: CmCityApp.#removeStat,
            rollStats: CmCityApp.#rollStats,
            showMap: CmCityApp.#showMap,
            sortObjects: CmCityApp.#sortObjects,
        }
    };

    static PARTS = {
        header: {
            template: `modules/${MODULE_ID}/templates/city/parts/cm-city-header.hbs`,
        },
        tabs: {
            // Foundry-provided generic template
            template: 'templates/generic/tab-navigation.hbs',
            // classes: ['sysclass'], // Optionally add extra classes to the part for extra customization
        },
        stats: {
            template: `modules/${MODULE_ID}/templates/city/parts/cm-city-stats.tab.hbs`,
            classes: ['cm-cities-app-tab-stats']
        },
        finances: {
            template: `modules/${MODULE_ID}/templates/city/parts/cm-city-finances-tab.hbs`,
            scrollable: ['']
        },
        buildings: {
            template: `modules/${MODULE_ID}/templates/city/parts/cm-city-buildings-tab.hbs`,
            scrollable: ['']
        },
        peoples: {
            template: `modules/${MODULE_ID}/templates/city/parts/cm-city-peoples-tab.hbs`,
            scrollable: ['']
        },
        chests: {
            template: `modules/${MODULE_ID}/templates/city/parts/cm-city-chests-tab.hbs`,
            scrollable: ['']
        },
        armies: {
            template: `modules/${MODULE_ID}/templates/city/parts/cm-city-armies-tab.hbs`,
            scrollable: ['']
        },
        footer: {
            template: "templates/generic/form-footer.hbs",
        }
    }

    static TABS = {
        primary: {
            tabs: [
                { id: "stats", label: "CM.app.city.tab.stats.label", icon: "fa-solid fa-scroll", tooltip: "", cssClass: "" },
                { id: "finances", label: "CM.app.city.tab.finances.label", icon: "fa-solid fa-coins", tooltip: "", cssClass: "" },
                { id: "armies", label: "CM.app.city.tab.armies.label", icon: "fa-solid fa-shield-halved", tooltip: "", cssClass: "" },
                { id: "peoples", label: "CM.app.city.tab.peoples.label", icon: "fa-solid fa-people-group", tooltip: "", cssClass: "" },
                { id: "buildings", label: "CM.app.city.tab.buildings.label", icon: "fa-solid fa-chess-rook", tooltip: "", cssClass: "" },
                { id: "chests", label: "CM.app.city.tab.chests.label", icon: "fa-solid fa-gem", tooltip: "", cssClass: "" }
            ],
            labelPrefix: "CM.app.city.tab", // Optional. Prepended to the id to generate a localization key
            initial: "stats", // Set the initial tab
        },
    };

    static #getHiddenTabs() {
        const TABS = ["stats", "finances", "armies", "peoples", "buildings", "chests"];
        return TABS.filter(id => !game.settings.get(MODULE_ID, `tab.${id}.visible`));
    }

    _configureRenderOptions(options) {
        super._configureRenderOptions(options);

        // Masquer les parts désactivées (sauf header, tabs, footer)
        const PROTECTED = ["header", "tabs", "footer"];
        const hiddenTabs = CmCityApp.#getHiddenTabs();

        options.parts = options.parts.filter(part =>
            PROTECTED.includes(part) || !hiddenTabs.includes(part)
        );

        this.renderControls();
    }

    /** Handle user app rendering */
    _canRender(options) {
        if (!this.city.testUserPermission(game.user, "OBSERVER")) {
            ui.notifications.warn(game.i18n.localize("CM.app.city.messages.warn.render.permission"));
            return false;
        }
        return super._canRender(options);
    }

    /**
     * Show city's journal entry
     * @param {PointerEvent} event  click event
     * @param {HTMLElement} target  click target
     */
    static async #showJournal(event, target) {
        logger.debug("Cities App | showJournal", event, target)
        this.city.sheet.render(true)
    }

    // --------------------------------------------------------------------
    // SORTS
    // -------------------------------------------------------------------- 
    static async #sortObjects(event, target) {
        logger.debug("Cities App | sortUnits", event, target, this.#sort)
        const field = target.dataset.field;

        // Inverser la direction si même champ, sinon reset
        if (this.#sort.field === field) {
            this.#sort.direction *= -1;
        } else {
            this.#sort.field = field;
            this.#sort.direction = 1;
        }

        this.render();
    }
    // --------------------------------------------------------------------
    // MAP
    // -------------------------------------------------------------------- 
    /**
     * Show map
     * @param {PointerEvent} event  click event
     * @param {HTMLElement} target  click target
     */
    static async #showMap(event, target) {
        logger.debug("Cities App | showMap", event, target)
        const scene = await fromUuid(target.dataset.uuid);
        if (!scene) return;

        await scene.view();
    }

    // --------------------------------------------------------------------
    // STATS
    // -------------------------------------------------------------------- 
    /**
     * Add new stat
     * @param {PointerEvent} event  click event
     * @param {HTMLElement} target  click target
     */
    static async #addNewStat(event, target) {
        if (!this.isEditable) return
        logger.debug("Add new stat", target)

        const dialogForm = await addStatDialog.config()
        let newStatDatas = await addStatDialog.render(dialogForm);
        logger.debug("New stat datas", newStatDatas)
        if (!newStatDatas) return;
        newStatDatas.id = foundry.utils.randomID();
        var newStat = new StatDto(newStatDatas.id, newStatDatas.label, newStatDatas.base, newStatDatas.bonus, newStatDatas.malus, newStatDatas.rollFormula);
        logger.debug("New stat", newStat)
        this.cityDatas.stats[newStatDatas.id] = newStat
        await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
        this.render();
    }

    /**
   * Edit stat
   * @param {PointerEvent} event  click event
   * @param {HTMLElement} target  click target
   */
    static async #editStat(event, target) {
        if (!this.isEditable) return
        logger.debug("Edit stat", event, target)
        var statId = target.dataset.id

        if (Object.hasOwn(this.cityDatas.stats, statId)) {
            const statToEdit = this.cityDatas.stats[statId];
            logger.debug("Stat to edit", statToEdit)
            const dialogForm = await addStatDialog.config(statToEdit)
            let newStatDatas = await addStatDialog.render(dialogForm);
            logger.debug("Edited stat datas", newStatDatas)
            if (!newStatDatas) return;
            foundry.utils.mergeObject(statToEdit, newStatDatas, {
                insertKeys: true,
                insertValues: true,
                overwrite: true,
                recursive: true,
                inplace: true,
            });
            this.cityDatas.stats[statId] = statToEdit
            await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
            this.render();
        } else {
            logger.error("No stat found", statId)
        }
    }

    /**
    * Remove stat
    * @param {PointerEvent} event  click event
    * @param {HTMLElement} target  click target
    */
    static async #removeStat(event, target) {
        if (!this.isEditable) return
        logger.debug("Remove stat", target, this.cityDatas)
        var statId = target.dataset.id

        if (Object.hasOwn(this.cityDatas.stats, statId)) {
            delete this.cityDatas.stats[statId]
            await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
            this.render();
        }
    }

    /**
    * Roll stats dice
    * @param {PointerEvent} event  click event
    * @param {HTMLElement} target  click target
    */
    static async #rollStats(event, target) {
        logger.debug("Roll stats dice", target)

        const stat = this.cityDatas.stats[target.dataset.id]

        if (!stat.rollFormula) return

        const roll = new Roll(stat.rollFormula, stat);
        await roll.evaluate();

        var results_html = `<h2 class="standard">
        <i class="fas fa-dice-d20"></i> ${game.i18n.localize("CM.app.city.tab.stats.roll.skill.title")}</h2>
        <b>${game.i18n.localize(stat.label)}</b> pour ${this.cityDatas.name}`
        // Afficher dans le chat
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker(),
            flavor: results_html,
        });
    }

    // --------------------------------------------------------------------
    // BUILDINGS
    // -------------------------------------------------------------------- 
    /**
    * Show building details
    * @param {PointerEvent} event  click event
    * @param {HTMLElement} target  click target
    */
    static async #showDetailsBuilding(event, target) {
        logger.debug("Cities App | showDetailsBuilding", event, target)
        if (!target.dataset.id) return

        var building = this.cityDatas.buildings[target.dataset.id]
        logger.debug("Building details", building)
        if (building.uuid) {
            const obj = await fromUuid(building.uuid);
            obj?.sheet?.render(true)
        } else {
            // TODO : Building sheet feature
            //building.getSheet().render(true)
        }
    }

    /**
     * Toggle element view for players
     * @param {PointerEvent} event  click event
     * @param {HTMLElement} target  click target
     */
    static async #toggleBuildingView(event, target) {
        if (!this.isEditable) return

        logger.debug("Cities App | toggleBuildingView", event, target)
        var buildingId = target.dataset.id

        if (Object.hasOwn(this.cityDatas.buildings, buildingId)) {
            logger.debug("Cities App | toggleBuildingView - datas", this.cityDatas)
            let buildingToEdit = this.cityDatas.buildings[buildingId];
            logger.debug("Cities App | toggleBuildingView - building to edit", buildingToEdit)
            buildingToEdit.isVisibleForPlayer = buildingToEdit.isVisibleForPlayer ? false : true
            this.cityDatas.buildings[buildingId] = buildingToEdit
            logger.debug("Cities App | toggleBuildingView - datas", this.cityDatas)
            await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
            this.render();
        }
    }

    /**
    * Add new building
    * @param {PointerEvent} event  click event
    * @param {HTMLElement} target  click target
    */
    static async #addNewBuilding(event, target) {
        if (!this.isEditable) return
        logger.debug("Cities App | addNewBuilding", event, target)

        let newBuildingDatas = await addBuildingDialog.render();
        logger.debug("New building datas", newBuildingDatas)
        if (!newBuildingDatas) return;
        newBuildingDatas.id = foundry.utils.randomID();
        let owner = newBuildingDatas.ownerId ? {
            "id": newBuildingDatas.ownerId,
            "name": newBuildingDatas.ownerName,
            "img": newBuildingDatas.ownerImg,
            "uuid": newBuildingDatas.ownerUuid
        } : {}
        var newBuilding = new BuildingDto(newBuildingDatas.id,
            newBuildingDatas.uuid,
            newBuildingDatas.name,
            newBuildingDatas.img,
            newBuildingDatas.nbr,
            newBuildingDatas.cost,
            newBuildingDatas.price,
            owner
        ).toObject();
        logger.debug("New building", newBuilding)
        this.cityDatas.buildings[newBuildingDatas.id] = newBuilding
        await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
        this.render();
    }

    /**
    * Edit building
    * @param {PointerEvent} event  click event
    * @param {HTMLElement} target  click target
    */
    static async #editBuilding(event, target) {
        if (!this.isEditable) return
        logger.debug("Cities App | editBuilding", event, target)
        var buildingId = target.dataset.id

        if (Object.hasOwn(this.cityDatas.buildings, buildingId)) {
            const buildingToEdit = this.cityDatas.buildings[buildingId];
            logger.debug("Cities App | editBuilding - building to edit", buildingToEdit)
            let newBuildingDatas = await addBuildingDialog.render(buildingToEdit);
            logger.debug("Cities App | editBuilding - edited building datas", newBuildingDatas)
            if (!newBuildingDatas) return;
            newBuildingDatas.owner = newBuildingDatas.ownerId ? {
                "id": newBuildingDatas.ownerId,
                "name": newBuildingDatas.ownerName,
                "img": newBuildingDatas.ownerImg,
                "uuid": newBuildingDatas.ownerUuid
            } : { id: "", name: "", img: "", uuid: "" }
            foundry.utils.mergeObject(buildingToEdit, newBuildingDatas, {
                insertKeys: true,
                insertValues: true,
                overwrite: true,
                recursive: true,
                inplace: true,
            });
            logger.debug("Cities App | editBuilding - merged building datas", buildingToEdit)
            this.cityDatas.buildings[buildingId] = buildingToEdit
            await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
            this.render();
        } else {
            logger.error("No building found", buildingId)
        }
    }

    /**
     * Remove building
     * @param {PointerEvent} event  click event
     * @param {HTMLElement} target  click target
     */
    static async #removeBuilding(event, target) {
        if (!this.isEditable) return

        logger.debug("Cities App | removeBuilding", event, target)
        var buildingId = target.dataset.id

        if (Object.hasOwn(this.cityDatas.buildings, buildingId)) {
            delete this.cityDatas.buildings[buildingId]
            await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
            this.render();
        }
    }

    // --------------------------------------------------------------------
    // ARMY UNITS
    // -------------------------------------------------------------------- 
    /**
    * Add new army unit
    * @param {PointerEvent} event  click event
    * @param {HTMLElement} target  click target
    */
    static async #addNewUnit(event, target) {
        if (!this.isEditable) return
        logger.debug("Add new army unit", event, target)

        let newUnitDatas = await addArmiesUnitDialog.render();
        logger.debug("New unit", newUnitDatas)
        if (!newUnitDatas) return;
        newUnitDatas.id = foundry.utils.randomID();
        this.cityDatas.armies.units[newUnitDatas.id] = new ArmyUnitDto(newUnitDatas.id, newUnitDatas.uuid, newUnitDatas.name, newUnitDatas.img, newUnitDatas.role, newUnitDatas.nbr, newUnitDatas.cost).toObject();
        await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
        this.render();
    }

    /**
    * Edit army unit
    * @param {PointerEvent} event  click event
    * @param {HTMLElement} target  click target
    */
    static async #editUnit(event, target) {
        if (!this.isEditable) return
        logger.debug("Edit army unit", event, target)
        var unitId = target.dataset.id

        if (Object.hasOwn(this.cityDatas.armies.units, unitId)) {
            const unitToEdit = this.cityDatas.armies.units[unitId];
            logger.debug("Cities App | editUnit - unit to edit", unitToEdit)
            let newUnitDatas = await addArmiesUnitDialog.render(unitToEdit);
            logger.debug("Cities App | editUnit - edited unit datas", newUnitDatas)
            if (!newUnitDatas) return;
            foundry.utils.mergeObject(unitToEdit, newUnitDatas, {
                insertKeys: true,
                insertValues: true,
                overwrite: true,
                recursive: true,
                inplace: true,
            });
            this.cityDatas.armies.units[unitId] = unitToEdit
            await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
            this.render();
        } else {
            logger.error("No Unit found", unitId)
        }
    }

    /**
    * Remove army unit
    * @param {PointerEvent} event  click event
    * @param {HTMLElement} target  click target
    */
    static async #removeUnit(event, target) {
        if (!this.isEditable) return
        logger.debug("Remove army unit", event, target)
        var peopleId = target.dataset.id

        if (Object.hasOwn(this.cityDatas.armies.units, peopleId)) {
            delete this.cityDatas.armies.units[peopleId]
            await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
            this.render();
        }
    }

    // --------------------------------------------------------------------
    // FINANCE ENTRIES
    // -------------------------------------------------------------------- 
    /**
   * Add new finance entry
   * @param {PointerEvent} event  click event
   * @param {HTMLElement} target  click target
   */
    static async #addNewFinanceEntry(event, target) {
        if (!this.isEditable) return
        event.preventDefault();
        event.stopPropagation();
        logger.debug("Add new finance entry", target)

        const dialogForm = await addFinanceEntryDialog.config({
            financeEntryTypes: financeEntryTypes,
        })
        let newEntry = await addFinanceEntryDialog.render(dialogForm);
        logger.debug("New entry", newEntry)
        if (!newEntry) return;
        newEntry.id = foundry.utils.randomID();
        this.cityDatas.finances.entries[newEntry.id] = new FinanceEntryDto(newEntry.id, newEntry.label, newEntry.type, newEntry.value);
        await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
        this.render();
    }

    /**
   * Add remove finance entry
   * @param {PointerEvent} event  click event
   * @param {HTMLElement} target  click target
   */
    static async #removeFinanceEntry(event, target) {
        if (!this.isEditable) return
        logger.debug("Cities App | removeFinanceEntry", event, target)
        const entryId = target.dataset.id

        if (Object.hasOwn(this.cityDatas.finances.entries, entryId)) {
            delete this.cityDatas.finances.entries[entryId]
            await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
            this.render();
        }
    }

    // --------------------------------------------------------------------
    // OBJECTS
    // -------------------------------------------------------------------- 
    /**
   * Show object details
   * @param {PointerEvent} event  click event
   * @param {HTMLElement} target  click target
   */
    static async #showDetails(event, target) {
        logger.debug("Cities App | showDetails", event, target)
        if (!target.dataset.uuid) return
        const obj = await fromUuid(target.dataset.uuid);
        obj?.sheet?.render(true)
    }

    /**
     * Toggle element view for players
     * @param {PointerEvent} event  click event
     * @param {HTMLElement} target  click target
     */
    static async #toggleTreasuryView(event, target) {
        if (!this.isEditable) return

        logger.debug("Cities App | toggleTreasuryView", event, target)
        var treasuryId = target.dataset.id

        if (Object.hasOwn(this.cityDatas.chests, treasuryId)) {
            logger.debug("Cities App | toggleTreasuryView - datas", this.cityDatas)
            let treasuryToEdit = this.cityDatas.chests[treasuryId];
            logger.debug("Cities App | toggleTreasuryView - building to edit", treasuryToEdit)
            treasuryToEdit.isVisibleForPlayer = treasuryToEdit.isVisibleForPlayer ? false : true
            this.cityDatas.chests[treasuryId] = treasuryToEdit
            logger.debug("Cities App | toggleTreasuryView - datas", this.cityDatas)
            await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
            this.render();
        }
    }

    /**
     * Remove treasury
     * @param {PointerEvent} event  click event
     * @param {HTMLElement} target  click target
     */
    static async #removeTreasury(event, target) {
        if (!this.isEditable) return

        logger.debug("Cities App | removeTreasury", event, target)
        var treasuryId = target.dataset.id

        if (Object.hasOwn(this.cityDatas.chests, treasuryId)) {
            delete this.cityDatas.chests[treasuryId]
            await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
            this.render();
        }
    }

    // --------------------------------------------------------------------
    // PEOPLES
    // -------------------------------------------------------------------- 
    /**
     * Toggle element view for players
     * @param {PointerEvent} event  click event
     * @param {HTMLElement} target  click target
     */
    static async #togglePeopleView(event, target) {
        if (!this.isEditable) return

        logger.debug("Cities App | togglePeopleView", event, target)
        var peopleId = target.dataset.id

        if (Object.hasOwn(this.cityDatas.population.peoples, peopleId)) {
            logger.debug("Cities App | togglePeopleView - datas", this.cityDatas)
            let peopleToEdit = this.cityDatas.population.peoples[peopleId];
            logger.debug("Cities App | togglePeopleView - people to edit", peopleToEdit)
            peopleToEdit.isVisibleForPlayer = peopleToEdit.isVisibleForPlayer ? false : true
            this.cityDatas.population.peoples[peopleId] = peopleToEdit
            logger.debug("Cities App | togglePeopleView - datas", this.cityDatas)
            await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
            this.render();
        }
    }

    /**
     * Remove people
     * @param {PointerEvent} event  click event
     * @param {HTMLElement} target  click target
     */
    static async #removePeople(event, target) {
        if (!this.isEditable) return

        logger.debug("Cities App | removePeople", event, target)
        var peopleId = target.dataset.id

        if (Object.hasOwn(this.cityDatas.population.peoples, peopleId)) {
            delete this.cityDatas.population.peoples[peopleId]
            await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
            this.render();
        }
    }

    // Handler to change avatars
    static async #onEditImage(event, target) {
        if (!this.isEditable) return

        logger.debug("Cities App | onEditImage", event, target)
        const field = target.dataset.field || "img"
        logger.debug("IMG field", field)
        const current = foundry.utils.getProperty(this.cityDatas, field)

        /*const isForgeVTT = (typeof ForgeVTT !== "undefined" && ForgeVTT.usingTheForge);
        const source = isForgeVTT ? "forgevtt" : "public";*/

        //logger.debug("Cities App | onEditImage - isForgeVTT / source / SOURCES", isForgeVTT, source, FilePicker.SOURCES);

        const fp = new FilePicker({
            type: "image",
            //activeSource: source,
            current: current,
            callback: (path) => {
                // Mettre à jour l'aperçu immédiatement
                event.target.src = path;
                foundry.utils.setProperty(this.cityDatas, field, path);
                // Déclencher un submit si submitOnChange est actif
                event.target.dispatchEvent(new Event("change", { bubbles: true }));
            }
        })

        fp.render(true)
    }

    // --------------------------------------------------------------------
    // DRAG n DROP
    // -------------------------------------------------------------------- 
    /**
       * Define whether a user is able to begin a dragstart workflow for a given drag selector
       * @param {string} selector       The candidate HTML selector for dragging
       * @returns {boolean}             Can the current user drag this selector?
       * @protected
       */
    _canDragStart(selector) {
        // game.user fetches the current user
        return this.isEditable;
    }

    /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
    _canDragDrop(selector) {
        // game.user fetches the current user
        return this.isEditable;
    }

    /**
    * Create drag-and-drop workflow handlers for this Application
    * @returns {DragDrop[]}     An array of DragDrop handlers
    * @private
    */
    #createDragDropHandlers() {
        return this.options.dragDrop.map((d) => {
            d.permissions = {
                dragstart: this._canDragStart.bind(this),
                drop: this._canDragDrop.bind(this),
            };
            d.callbacks = {
                dragstart: this._onDragStart.bind(this),
                dragover: this._onDragOver.bind(this),
                dragleave: this._onDragLeave.bind(this),
                drop: this._onDrop.bind(this),
            };
            return new DragDrop(d);
        });
    }

    // Optional: Add getter to access the private property

    /**
     * Returns an array of DragDrop instances
     * @type {DragDrop[]}
     */
    get dragDrop() {
        return this.#dragDrop;
    }

    /**
      * Callback actions which occur at the beginning of a drag start workflow.
      * @param {DragEvent} event       The originating DragEvent
      * @protected
      */
    _onDragStart(event) {
        logger.debug("Cities App | onDragStart", event)
        const el = event.currentTarget;
        if ('link' in event.target.dataset) return;

        // Extract the data
        const dragData = {
            type: "JournalEntry",
            uuid: journal.uuid
        };

        if (!dragData) return;

        // Set data transfer
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    }


    /**
     * Callback actions which occur when a dragged element is over a drop target.
     * @param {DragEvent} event       The originating DragEvent
     * @protected
     */
    _onDragOver(event) {
        event.preventDefault();
        event.target.classList.add("drag-over");
    }

    _onDragLeave(event) {
        event.preventDefault();
        event.target.classList.remove("drag-over");
    }

    async _onDrop(event) {
        if (!this.isEditable) return

        logger.debug("Drop event", event)
        const data = TextEditor.getDragEventData(event);
        logger.debug("Drop", data)

        if (data.type === "Actor" && event.target.dataset.dropPeoples) {
            await this._onDropActor(data.uuid)
        }

        if (data.type === "Actor" && event.target.dataset.dropUnits) {
            await this._onDropUnits(data.uuid)
        }

        if (data.type === "Item" && event.target.dataset.dropBuildings) {
            await this._onDropBuilding(data.uuid)
        }

        if (data.type === "Item" && event.target.dataset.dropChests) {
            await this._onDropItem(data.uuid)
        }

        if (data.type === "Scene" && event.target.dataset.dropMap) {
            await this._onDropMap(data.uuid)
        }
    }

    async _onDropMap(sceneUUID) {
        const scene = await fromUuid(sceneUUID);
        if (!scene) return;
        logger.debug("Drop scene", scene);

        this.cityDatas.map.id = sceneUUID
        this.cityDatas.map.img = scene.thumb ?? "icons/tools/navigation/map-chart-tan.webp";

        await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
        this.render();
    }

    async _onDropActor(actorUUID) {
        const actor = await fromUuid(actorUUID);
        if (!actor) return;
        logger.debug("Drop actor", actor)

        // Add people to current city
        this.cityDatas.population.peoples[actor.id] = {
            id: actor.id,
            uuid: actor.uuid,
            name: actor.name,
            img: actor.img,
            role: "people"
        };

        await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
        this.render();
    }

    async _onDropUnits(actorUUID) {
        const actor = await fromUuid(actorUUID);
        if (!actor) return;
        logger.debug("Drop unit", actor)

        // Add unit to current city
        let defaultRole = game.i18n.localize("CM.dialog.newUnit.role.default.value");
        this.cityDatas.armies.units[actor.id] = new ArmyUnitDto(actor.id, actor.uuid, actor.name, actor.img, defaultRole, 1, 0).toObject();
        await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
        this.render();
    }

    async _onDropBuilding(itemUUID) {
        const item = await fromUuid(itemUUID);
        if (!item) return;
        logger.debug("Drop building", item)

        // Add building to current city
        this.cityDatas.buildings[item.id] = new BuildingDto(item.id, item.uuid, item.name, item.img).toObject();
        await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
        this.render();
    }

    async _onDropItem(itemUUID) {
        const item = await fromUuid(itemUUID);
        if (!item) return;
        logger.debug("Drop item", item)

        // Add treasure to current city chests
        this.cityDatas.chests[item.id] = {
            id: item.id,
            uuid: item.uuid,
            name: item.name,
            img: item.img,
            nbr: 1,
            price: 0
        };

        await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
        this.render();
    }

    // --------------------------------------------------------------------
    // RENDERING
    // -------------------------------------------------------------------- 
    /**
    * Actions performed after any render of the Application.
    * Post-render steps are not awaited by the render process.
    * @param {ApplicationRenderContext} context      Prepared context data
    * @param {RenderOptions} options                 Provided render options
    * @protected
    */
    _onRender(context, options) {
        super._onRender(context, options);

        this.#hooks.push(
            Hooks.on("updateActor", (actor, changes, options, userId) => {
                logger.debug("Hook update actor", actor)
                if (Object.hasOwn(this.cityDatas.armies.units, actor.id)) {
                    logger.debug("Update army unit", actor)
                    this.cityDatas.armies.units[actor.id] = new ArmyUnitDto(actor.id, actor.uuid, actor.name, actor.img, "soldier", 1, 0).toObject();
                    CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
                    this.render();
                };

                // TODO peoples
            })
        );

        this.#hooks.push(
            Hooks.on("deleteActor", (actor) => {
                if (Object.hasOwn(this.cityDatas.armies.units, actor.id)) {
                    delete this.cityDatas.armies.units[actor.id]
                    CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
                    this.render();
                }

                // TODO peoples
            })
        );

        this.#dragDrop.forEach((d) => d.bind(this.element));
    }

    // Cleaning on close
    _onClose(options) {
        super._onClose(options);
        this.#hooks.forEach(hookId => Hooks.off(hookId));
        this.#hooks = [];
    }

    /**
       * Process form submission for the sheet
       * @this {CmCityApp}         The handler is called with the application as its bound scope
       * @param {SubmitEvent} event         The originating form submission event
       * @param {HTMLFormElement} form      The form element that was submitted
       * @param {FormDataExtended} formData Processed data for the submitted form
       * @returns {Promise<void>}
       */
    static async submitFormHandler(event, form, formData) {
        if (!this.isEditable) return

        // Do things with the returned FormData
        logger.debug("Cities App | submitFormHandler - Submit", event, form, formData)

        const datas = foundry.utils.expandObject(formData.object);
        logger.debug("Cities App | submitFormHandler - FormDatas", datas)

        logger.debug("Cities App | submitFormHandler - City to update", this.cityDatas)
        foundry.utils.mergeObject(this.cityDatas, datas.city, {
            insertKeys: true,    // ajouter les clés absentes de objA
            insertValues: true,  // ajouter les valeurs manquantes
            overwrite: true,     // objB écrase objA
            recursive: true,     // fusion récursive des objets imbriqués
            inplace: true,      // false = retourne un nouvel objet
        });
        logger.debug("Cities App | submitFormHandler - Updated city", this.cityDatas)

        this.cityDatas = CityDto.fromData(this.cityDatas);
        logger.debug("Cities App | submitFormHandler - City Datas", this.cityDatas)
        await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);

        await this._updateFrame({
            window: { title: this.cityDatas.name }
        });
        this.render(true)
        // update sidebar
        ui.sidebar.render();
    }

    /**
     * Prepare context that is specific to only a single rendered part.
     *
     * It is recommended to augment or mutate the shared context so that downstream methods like _onRender have
     * visibility into the data that was used for rendering. It is acceptable to return a different context object
     * rather than mutating the shared context at the expense of this transparency.
     *
     * @param {string} partId                         The part being rendered
     * @param {ApplicationRenderContext} context      Shared context provided by _prepareContext
     * @returns {Promise<ApplicationRenderContext>}   Context data for a specific part
     * @protected
     */
    async _preparePartContext(partId, context) {
        logger.debug("Cities App | context", partId, context)

        context.isGM = this.isGM
        context.isEditable = this.isEditable
        context.buttons = []

        // tabs configuration override
        const hiddenTabs = CmCityApp.#getHiddenTabs();
        const allTabs = this._prepareTabs("primary");
        context.tabs = Object.fromEntries(
            Object.entries(allTabs).filter(([id]) => !hiddenTabs.includes(id))
        );
        const activeTab = this.tabGroups.primary;
        if (hiddenTabs.includes(activeTab)) {
            const TAB_ORDER = ["stats", "finances", "armies", "peoples", "buildings", "chests"];
            const firstVisible = TAB_ORDER.find(id => !hiddenTabs.includes(id));
            if (firstVisible) this.tabGroups.primary = firstVisible;
        }
        context.tab = context.tabs[partId];

        const cityDatas = CmCitiesJournalDataStore.getCityData(this.city);
        logger.debug("Cities App | city datas", cityDatas)
        const sourceCity = CityDto.fromData(cityDatas);
        context.city = sourceCity;
        this.computeStats(context.city);

        context.financeEntryTypes = financeEntryTypes;
        let treasurySum = (Number(sourceCity.finances.treasury.currencies.pp) * 100) + (Number(sourceCity.finances.treasury.currencies.gp) * 10) + Number(sourceCity.finances.treasury.currencies.sp) + Number(sourceCity.finances.treasury.currencies.cp / 10)
        let expensesSum = Object.values(sourceCity.finances.entries).filter(entry => entry.type.key === financeEntryTypes.expense.key).reduce((sum, entry) => sum + entry.value, 0);
        let incomesSum = Object.values(sourceCity.finances.entries).filter(entry => entry.type.key === financeEntryTypes.income.key).reduce((sum, entry) => sum + entry.value, 0);
        let armiesSum = Object.values(sourceCity.armies.units).reduce((sum, unit) => sum + (unit.nbr * unit.cost), 0);
        let vaultsSum = Object.values(sourceCity.chests).reduce((sum, item) => sum + (item.nbr * item.price), 0);
        let buildingsSum = Object.values(sourceCity.buildings).reduce((sum, building) => sum + (building.nbr * building.cost + building.nbr * building.price), 0);
        let totalSum = Number(treasurySum) + Number(vaultsSum) + Number(incomesSum) - Number(expensesSum) - Number(armiesSum) - Number(buildingsSum)
        context.city.finances.total = {
            "treasury": treasurySum,
            "expenses": expensesSum,
            "incomes": incomesSum,
            "armies": armiesSum,
            "vaults": vaultsSum,
            "buildings": buildingsSum,
            "value": totalSum
        }

        context.hasNoStats = Object.keys(sourceCity.stats ?? {}).length < 1;
        context.hasNoPeoples = Object.keys(sourceCity.population.peoples ?? {}).length < 1;
        context.hasNoBuildings = Object.keys(sourceCity.buildings ?? {}).length < 1;
        context.hasNoTreasures = Object.keys(sourceCity.chests ?? {}).length < 1;
        context.hasNoEntries = Object.keys(sourceCity.finances.entries ?? {}).length < 1;
        context.hasNoUnits = Object.keys(sourceCity.armies.units ?? {}).length < 1;

        context.citySizeChoices = CONFIG.CM.city.sizes;

        // Sorts
        switch (partId) {
            case 'stats':
            case 'armies':
                if (this.#sort.field) {
                    // Sort armies units
                    context.city.armies.units = this.sortItems(sourceCity.armies.units);
                    context.armiesSort = this.#sort;
                }
                break;
            case 'peoples':
                if (this.#sort.field) {
                    // Sort peoples
                    context.city.population.peoples = this.sortItems(sourceCity.population.peoples);
                    context.peoplesSort = this.#sort;
                }
                break;
            case 'buildings':
                if (this.#sort.field) {
                    // Sort buildings
                    context.city.buildings = this.sortItems(sourceCity.buildings);
                    context.buildingsSort = this.#sort;
                }
                break;
            case 'chests':
                if (this.#sort.field) {
                    // Sort chests
                    context.city.chests = this.sortItems(sourceCity.chests);
                    context.chestsSort = this.#sort;
                }
                break;
            case 'finances':
                if (this.#sort.field) {
                    // Sort finances
                    context.city.finances.entries = this.sortItems(sourceCity.finances.entries);
                    context.financesEntriesSort = this.#sort;
                }
                break;
            default:
        }

        return context;
    }

    sortItems(itemsDatas) {
        logger.debug("Cities App | sortItems", itemsDatas, this.#sort)
        const items = Object.values(itemsDatas);
        const field = this.#sort.field;
        const dir = this.#sort.direction;

        items.sort((a, b) => {
            let valA = a[field] ?? "";
            let valB = b[field] ?? "";

            // Cas objet imbriqué avec propriété label (ex: type = { key, label })
            if (typeof valA === "object" && valA !== null) valA = valA.label ?? "";
            if (typeof valB === "object" && valB !== null) valB = valB.label ?? "";


            if (typeof valA === "number") return (valA - valB) * dir;
            return String(valA).localeCompare(String(valB)) * dir;
        });

        return Object.fromEntries(items.map(u => [u.id, u]));
    }

    computeStats(city) {
        for (const stat of Object.values(city.stats)) {
            stat.value = Number(stat.base) + Number(stat.bonus) - Number(stat.malus);
            stat.malusDisplay = stat.malus === 0 ? 0 : -Math.abs(stat.malus);
        }
    }

    _configureRenderOptions(options) {
        super._configureRenderOptions(options);
        logger.debug("Cities App | configureRenderOptions", options)

        this.renderControls()
    }

    renderControls() {
        if (game.user.isGM) {
            let toggleEditIcon = "fa-regular fa-solid fa-pen-to-square";
            let toggleEditLabel = "CM.app.city.options.editmode.label.off";
            if (this.isEditable) {
                toggleEditIcon = "fa-solid fa-pen-to-square";
                toggleEditLabel = "CM.app.city.options.editmode.label.on";
            }

            logger.debug("Cities App | renderControls - toggleEdit", toggleEditIcon, toggleEditLabel)
            this.options.window.controls = [
                {
                    icon: toggleEditIcon,
                    label: toggleEditLabel,
                    action: "optionEditAction",
                },
                {
                    icon: 'fa-solid fa-cogs',
                    label: "CM.app.city.options.goToSettings.label",
                    action: "optionGoToSettings",
                }
            ];
            logger.debug("Add controls", this.options.window.controls)
        }
    }

    /**
    * Option : city edit toggle
    * @param {PointerEvent} event  click event
    * @param {HTMLElement} target  click target
    */
    static async #optionEditAction(event, target) {
        if (!game.user.isGM) return;
        logger.debug("Cities App | editAction", event, target)
        this.isEditable = !this.isEditable
        game.settings.set(MODULE_ID, IS_CITY_EDIT_MODE, this.isEditable)

        this.render({ force: true, window: { controls: true } });
    }

    /**
    * Option : Go to the CM settings
    * @param {PointerEvent} event  click event
    * @param {HTMLElement} target  click target
    */
    static async #optionGoToSettings(event, target) {
        if (!game.user.isGM) return;
        logger.debug("Cities App | goToSettings", event, target)
        game.settings.sheet.render(true, { activeTab: "modules" });
    }
}