import { logger } from "../common/customLog.js"
import { MODULE_ID } from "../common/constants.js"
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

    constructor(city, options = {}) {
        super(options);
        this.city = city;
        this.cityDatas = CityDto.fromData(CmCitiesJournalDataStore.getCityData(city));
        this.#dragDrop = this.#createDragDropHandlers();
        this.isEditable = game.user.isGM || city.testUserPermission(game.user, "OWNER");
    }

    // Override title getter 
    get title() {
        logger.debug("Get window title", this.cityDatas)
        return this.cityDatas?.name ?? "CM.app.city.title";
    }

    static DEFAULT_OPTIONS = {
        id: "cm-city-app",
        icon: "fa-solid fa-landmark",
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
            resizable: true,
            controls: []
        },
        actions: {
            showDetails: CmCityApp.#showDetails,
            removePeople: CmCityApp.#removePeople,
            removeTreasury: CmCityApp.#removeTreasury,
            removeBuilding: CmCityApp.#removeBuilding,
            editImage: CmCityApp.#onEditImage,
            addNewFinanceEntry: CmCityApp.#addNewFinanceEntry,
            removeFinanceEntry: CmCityApp.#removeFinanceEntry,
            addNewUnit: CmCityApp.#addNewUnit,
            removeUnit: CmCityApp.#removeUnit,
            addNewBuilding: CmCityApp.#addNewBuilding,
            showDetailsBuilding: CmCityApp.#showDetailsBuilding,
            editAction: CmCityApp.#editAction,
            addNewStat: CmCityApp.#addNewStat,
            editStat: CmCityApp.#editStat,
            removeStat: CmCityApp.#removeStat,
            rollStats: CmCityApp.#rollStats,
            showMap: CmCityApp.#showMap
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

    /** Handle user app rendering */
    _canRender(options) {
        if (!this.city.testUserPermission(game.user, "OBSERVER")) {
            ui.notifications.warn("Vous ne pouvez pas afficher les détails de cette ville.");
            return false;
        }
        return super._canRender(options);
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
        logger.debug("Show map", target)
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
                insertKeys: true,    // ajouter les clés absentes de objA
                insertValues: true,  // ajouter les valeurs manquantes
                overwrite: true,     // objB écrase objA
                recursive: true,     // fusion récursive des objets imbriqués
                inplace: true,      // false = retourne un nouvel objet
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
        logger.debug("Show building details", target)
        if (!target.dataset.id) return

        var building = this.cityDatas.buildings[target.dataset.id]
        logger.debug("Building details", building)
        if (building.uuid) {
            const obj = await fromUuid(building.uuid);
            obj?.sheet?.render(true)
        } else {
            building.getSheet().render(true)
        }
    }

    /**
    * Add new building
    * @param {PointerEvent} event  click event
    * @param {HTMLElement} target  click target
    */
    static async #addNewBuilding(event, target) {
        if (!this.isEditable) return
        logger.debug("Add new building", target)

        const dialogForm = await addBuildingDialog.config({})
        let newBuildingDatas = await addBuildingDialog.render(dialogForm);
        logger.debug("New building datas", newBuildingDatas)
        if (!newBuildingDatas) return;
        newBuildingDatas.id = foundry.utils.randomID();
        var newBuilding = new BuildingDto(newBuildingDatas.id, newBuildingDatas.uuid, newBuildingDatas.name, newBuildingDatas.img);
        logger.debug("New building", newBuilding)
        this.cityDatas.buildings[newBuildingDatas.id] = newBuilding
        await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
        this.render();
    }

    /**
     * Remove building
     * @param {PointerEvent} event  click event
     * @param {HTMLElement} target  click target
     */
    static async #removeBuilding(event, target) {
        if (!this.isEditable) return

        logger.debug("Remove building", target)
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
        logger.debug("Add new army unit", target)

        const dialogForm = await addArmiesUnitDialog.config({})
        let newUnitDatas = await addArmiesUnitDialog.render(dialogForm);
        logger.debug("New unit", newUnitDatas)
        if (!newUnitDatas) return;
        newUnitDatas.id = foundry.utils.randomID();
        this.cityDatas.armies.units[newUnitDatas.id] = new ArmyUnitDto(newUnitDatas.id, newUnitDatas.uuid, newUnitDatas.name, newUnitDatas.img, newUnitDatas.role, newUnitDatas.nbr, newUnitDatas.cost);
        await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
        this.render();
    }

    /**
    * Remove army unit
    * @param {PointerEvent} event  click event
    * @param {HTMLElement} target  click target
    */
    static async #removeUnit(event, target) {
        if (!this.isEditable) return
        logger.debug("Remove army unit", target)
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
        logger.debug("remove finance entry", target)
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
        logger.debug("Show object details", target)
        if (!target.dataset.uuid) return
        const obj = await fromUuid(target.dataset.uuid);
        obj?.sheet?.render(true)
    }

    /**
     * Remove treasury
     * @param {PointerEvent} event  click event
     * @param {HTMLElement} target  click target
     */
    static async #removeTreasury(event, target) {
        if (!this.isEditable) return

        logger.debug("Remove treasury", target)
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
     * Remove people
     * @param {PointerEvent} event  click event
     * @param {HTMLElement} target  click target
     */
    static async #removePeople(event, target) {
        if (!this.isEditable) return

        logger.debug("Remove people", target)
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

        logger.debug("On edit image", event)
        const field = target.dataset.field || "img"
        logger.debug("IMG field", field)
        const current = foundry.utils.getProperty(this.cityDatas, field)

        const fp = new FilePicker({
            type: "image",
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
        const el = event.currentTarget;
        if ('link' in event.target.dataset) return;

        // Extract the data you need
        let dragData = null;

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
        this.cityDatas.armies.units[actor.id] = new ArmyUnitDto(actor.id, actor.uuid, actor.name, actor.img, defaultRole, 1, 0);
        await CmCitiesJournalDataStore.updateCity(this.city, this.cityDatas);
        this.render();
    }

    async _onDropBuilding(itemUUID) {
        const item = await fromUuid(itemUUID);
        if (!item) return;
        logger.debug("Drop building", item)

        // Add building to current city
        this.cityDatas.buildings[item.id] = new BuildingDto(item.id, item.uuid, item.name, item.img)
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
            nbr: item.system?.qty ?? 1,
            price: item.system?.price ?? 0
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
                    this.cityDatas.armies.units[actor.id] = new ArmyUnitDto(actor.id, actor.uuid, actor.name, actor.img, "soldier", 1, 0);
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
        logger.debug("Submit", event, form, formData)

        const datas = foundry.utils.expandObject(formData.object);
        logger.debug("FormDatas", datas)

        logger.debug("City to update", this.cityDatas)
        foundry.utils.mergeObject(this.cityDatas, datas.city, {
            insertKeys: true,    // ajouter les clés absentes de objA
            insertValues: true,  // ajouter les valeurs manquantes
            overwrite: true,     // objB écrase objA
            recursive: true,     // fusion récursive des objets imbriqués
            inplace: true,      // false = retourne un nouvel objet
        });
        logger.debug("Updated city", this.cityDatas)

        this.cityDatas = CityDto.fromData(this.cityDatas);
        logger.debug("City Datas", this.cityDatas)
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
        logger.debug("context", context)
        switch (partId) {
            case 'stats':
            case 'armies':
            case 'peoples':
            case 'buildings':
            case 'chests':
            case 'finances':
                context.tab = context.tabs[partId];
                break;
            default:
        }

        context.isEditable = this.isEditable
        context.buttons = [
            //{ type: "submit", icon: "fa-solid fa-save", label: "SETTINGS.Save" },
            // { type: "reset", action: "reset", icon: "fa-solid fa-undo", label: "SETTINGS.Reset" },
        ]
        context.tabs = this._prepareTabs("primary")
        const cityDatas = CmCitiesJournalDataStore.getCityData(this.city);
        logger.debug("City datas", cityDatas)
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

        return context;
    }

    computeStats(city) {
        for (const stat of Object.values(city.stats)) {
            stat.value = Number(stat.base) + Number(stat.bonus) - Number(stat.malus);
            stat.malusDisplay = stat.malus === 0 ? 0 : -Math.abs(stat.malus);
        }
    }

    _configureRenderOptions(options) {
        super._configureRenderOptions(options);
        logger.debug("_configureRenderOptions", options)

        if (game.user.isGM) {
            this.options.window.controls = [
                {
                    icon: 'fa-solid fa-screwdriver-wrench',
                    label: "CM.app.city.options.editmode.label",
                    action: "editAction",
                }
            ];
            logger.debug("Add controls", this.options.window.controls)
        }
    }

    /**
    * Options edit
    * @param {PointerEvent} event  click event
    * @param {HTMLElement} target  click target
    */
    static async #editAction(event, target) {
        if (!game.user.isGM) return;
        logger.debug("editAction", target)
        this.isEditable = !this.isEditable
        this.render()
    }
}