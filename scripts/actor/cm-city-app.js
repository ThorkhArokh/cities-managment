import { logger } from "../common/customLog.js"
import { MODULE_ID } from "../common/constants.js"
import { CmDataStore } from "../common/cm-data-store.js"
import { BuildingDto } from "../model/cm-building-dto.js"
import { FinanceEntryDto, financeEntryTypes } from "../model/cm-finance-entry-dto.js"
import { ArmyUnitDto } from "../model/cm-army-unit-dto.js"
import { addArmiesUnitDialog } from "../dialogs/cm-city-add-armies-unit-dialog.js"
import { addFinanceEntryDialog } from "../dialogs/cm-city-add-finance-entry-dialog.js"

const { ApplicationV2, DialogV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { DragDrop, TextEditor, FormDataExtended } = foundry.applications.ux;
const { FilePicker } = foundry.applications.apps;
const { renderTemplate } = foundry.applications.handlebars;

export class CmCityApp extends HandlebarsApplicationMixin(ApplicationV2) {
    #dragDrop;
    #hooks = [];

    constructor(city, options = {}) {
        super(options);
        this.city = city;
        this.#dragDrop = this.#createDragDropHandlers();
        this.isEditable = game.user.isGM;
    }

    // Override title getter 
    get title() {
        logger.debug("Get window title", this.city)
        return this.city?.name ?? "CM.tab.title";
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
            { dragSelector: null, dropSelector: "[data-drop-units]" }
        ],
        position: {
            width: 800,
            height: 600,
            top: 150,
            left: 150,
        },
        window: {
            title: "CM.app.title",
            resizable: true,
            /*controls: [
                {
                    // font awesome icon
                    icon: 'fa-solid fa-screwdriver-wrench',
                    // string that will be run through localization
                    label: "Options",
                    // string that MUST match one of your `actions`
                    action: "optionsAction",
                },
            ]*/
        },
        actions: {
            showDetails: CmCityApp.#showDetails,
            removePeople: CmCityApp.#removePeople,
            removeTreasury: CmCityApp.#removeTreasury,
            removeBuilding: CmCityApp.#removeBuilding,
            editImage: CmCityApp.#onEditImage,
            rollStats: CmCityApp.#rollStats,
            addNewFinanceEntry: CmCityApp.#addNewFinanceEntry,
            removeFinanceEntry: CmCityApp.#removeFinanceEntry,
            addNewUnit: CmCityApp.#addNewUnit,
            removeUnit: CmCityApp.#removeUnit
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
                { id: "stats", label: "CM.app.tab.stats.label", icon: "", tooltip: "", cssClass: "" },
                { id: "finances", label: "CM.app.tab.finances.label", icon: "", tooltip: "", cssClass: "" },
                { id: "armies", label: "CM.app.tab.armies.label", icon: "", tooltip: "", cssClass: "" },
                { id: "peoples", label: "CM.app.tab.peoples.label", icon: "", tooltip: "", cssClass: "" },
                { id: "buildings", label: "CM.app.tab.buildings.label", icon: "", tooltip: "", cssClass: "" },
                { id: "chests", label: "CM.app.tab.chests.label", icon: "", tooltip: "", cssClass: "" }
            ],
            labelPrefix: "CM.app.tab", // Optional. Prepended to the id to generate a localization key
            initial: "stats", // Set the initial tab
        },
    };

    /**
   * Add new army unit
   * @param {PointerEvent} event  click event
   * @param {HTMLElement} target  click target
   */
    static async #addNewUnit(event, target) {
        if (!this.isEditable) return
        logger.debug("Add new army unit", target)

        let newUnitDatas
        try {
            const dialogForm = await addArmiesUnitDialog.config({})
            newUnitDatas = await DialogV2.wait(dialogForm);
        } catch (ex) {
            logger.debug("User did not create new unit.", ex);
            return;
        }

        logger.debug("New unit", newUnitDatas)
        if (!newUnitDatas || newUnitDatas === "cancel") return;
        if (newUnitDatas.isSystemActor) {
            const actor = await Actor.create({
                name: newUnitDatas.name,
                type: "npc",
                img: "icons/environment/people/commoner.webp",
            });
            newUnitDatas.id = actor.id
            newUnitDatas.uuid = actor.uuid
            newUnitDatas.img = actor.img
        } else {
            newUnitDatas.id = foundry.utils.randomID();
        }
        this.city.armies.units[newUnitDatas.id] = new ArmyUnitDto(newUnitDatas.id, newUnitDatas.uuid, newUnitDatas.name, newUnitDatas.img, newUnitDatas.role, newUnitDatas.nbr, newUnitDatas.cost);
        await CmDataStore.updateCity(this.city);
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

        if (Object.hasOwn(this.city.armies.units, peopleId)) {
            delete this.city.armies.units[peopleId]
            await CmDataStore.updateCity(this.city);
            this.render();
        }
    }

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

        let newEntry
        try {
            const dialogForm = await addFinanceEntryDialog.config({
                financeEntryTypes: financeEntryTypes,
            })
            newEntry = await DialogV2.wait(dialogForm);
        } catch {
            logger.debug("User did not create new entry.");
            return;
        }

        logger.debug("New entry", newEntry)
        if (!newEntry || newEntry === "cancel") return;
        newEntry.id = foundry.utils.randomID();
        this.city.finances.entries[newEntry.id] = new FinanceEntryDto(newEntry.id, newEntry.label, newEntry.type, newEntry.value);
        await CmDataStore.updateCity(this.city);
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

        if (Object.hasOwn(this.city.finances.entries, entryId)) {
            delete this.city.finances.entries[entryId]
            await CmDataStore.updateCity(this.city);
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

        const stat = this.city.stats[target.dataset.id]

        const roll = new Roll('1d100');
        await roll.evaluate();
        logger.debug("Res : " + stat.value + " > " + roll.total, stat);

        var results_html = `<h2 class="standard"><i class="fas fa-dice-d20"></i> Réussite</h2><b>${game.i18n.localize(stat.label)}</b> pour ${this.city.name}`
        if (stat.value > roll.total) {
            results_html = `<h2 class="standard"><i class="fas fa-dice-d20"></i> Echec</h2><b>${game.i18n.localize(stat.label)}</b> pour ${this.city.name}`
        }

        // Afficher dans le chat
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.city }),
            flavor: results_html,
        });
    }

    /**
   * Show object details
   * @param {PointerEvent} event  click event
   * @param {HTMLElement} target  click target
   */
    static async #showDetails(event, target) {
        logger.debug("Show Actor details", target)
        if (!target.dataset.uuid) return
        const obj = await fromUuid(target.dataset.uuid);
        obj?.sheet?.render(true)
    }

    /**
     * Remove people
     * @param {PointerEvent} event  click event
     * @param {HTMLElement} target  click target
     */
    static async #removePeople(event, target) {
        if (!this.isEditable) return

        logger.debug("Remove people", target)
        var peopleId = target.dataset.id

        if (Object.hasOwn(this.city.population.peoples, peopleId)) {
            delete this.city.population.peoples[peopleId]
            await CmDataStore.updateCity(this.city);
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

        logger.debug("Remove treasury", target)
        var treasuryId = target.dataset.id

        if (Object.hasOwn(this.city.chests, treasuryId)) {
            delete this.city.chests[treasuryId]
            await CmDataStore.updateCity(this.city);
            this.render();
        }
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

        if (Object.hasOwn(this.city.buildings, buildingId)) {
            delete this.city.buildings[buildingId]
            await CmDataStore.updateCity(this.city);
            this.render();
        }
    }

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

    // Handler to change avatars
    static async #onEditImage(event, target) {
        if (!this.isEditable) return

        logger.debug("On edit image", event)
        const field = target.dataset.field || "img"
        logger.debug("IMG field", field)
        const current = foundry.utils.getProperty(this.city, field)

        const fp = new FilePicker({
            type: "image",
            current: current,
            callback: (path) => {
                // Mettre à jour l'aperçu immédiatement
                event.target.src = path;
                foundry.utils.setProperty(this.city, field, path);
                // Déclencher un submit si submitOnChange est actif
                event.target.dispatchEvent(new Event("change", { bubbles: true }));
            }
        })

        fp.render(true)
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
    }

    async _onDropActor(actorUUID) {
        const actor = await fromUuid(actorUUID);
        if (!actor) return;
        logger.debug("Drop actor", actor)

        // Add people to current city
        this.city.population.peoples[actor.id] = {
            id: actor.id,
            uuid: actor.uuid,
            name: actor.name,
            img: actor.img,
            role: "people"
        };

        await CmDataStore.updateCity(this.city);
        this.render();
    }

    async _onDropUnits(actorUUID) {
        const actor = await fromUuid(actorUUID);
        if (!actor) return;
        logger.debug("Drop unit", actor)

        // Add unit to current city
        let defaultRole = game.i18n.localize("CM.dialog.newUnit.role.default.value");
        this.city.armies.units[actor.id] = new ArmyUnitDto(actor.id, actor.uuid, actor.name, actor.img, defaultRole, 1, 0);

        await CmDataStore.updateCity(this.city);
        this.render();
    }

    async _onDropBuilding(itemUUID) {
        const item = await fromUuid(itemUUID);
        if (!item) return;
        logger.debug("Drop building", item)

        // Add building to current city
        this.city.buildings[item.id] = new BuildingDto(item.id, item.uuid, item.name, item.img)
        await CmDataStore.updateCity(this.city);
        this.render();
    }

    async _onDropItem(itemUUID) {
        const item = await fromUuid(itemUUID);
        if (!item) return;
        logger.debug("Drop item", item)

        // Add treasure to current city chests
        this.city.chests[item.id] = {
            id: item.id,
            uuid: item.uuid,
            name: item.name,
            img: item.img,
            nbr: item.system?.qty ?? 1,
            price: item.system?.price ?? 0
        };

        await CmDataStore.updateCity(this.city);
        this.render();
    }

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
                if (Object.hasOwn(this.city.armies.units, actor.id)) {
                    logger.debug("Update army unit", actor)
                    this.city.armies.units[actor.id] = new ArmyUnitDto(actor.id, actor.uuid, actor.name, actor.img, "soldier", 1, 0);
                    CmDataStore.updateCity(this.city);
                    this.render();
                };

                // TODO peoples
            })
        );

        this.#hooks.push(
            Hooks.on("deleteActor", (actor) => {
                if (Object.hasOwn(this.city.armies.units, actor.id)) {
                    delete this.city.armies.units[actor.id]
                    CmDataStore.updateCity(this.city);
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

        // Remapping finance entries datas to object
        var financeEntries = datas.city?.finances?.entries ?? {}
        var mappedEntries = Object.entries(financeEntries).map(([id, entry]) => new FinanceEntryDto(id, entry.label, entry.type, entry.value));
        logger.debug("Mapped entries", mappedEntries)
        mappedEntries.forEach(entry => {
            datas.city.finances.entries[entry.id] = entry
        })

        foundry.utils.mergeObject(this.city, datas.city, {
            insertKeys: true,    // ajouter les clés absentes de objA
            insertValues: true,  // ajouter les valeurs manquantes
            overwrite: true,     // objB écrase objA
            recursive: true,     // fusion récursive des objets imbriqués
            inplace: true,      // false = retourne un nouvel objet
        });
        logger.debug("Updated city", this.city)

        await CmDataStore.updateCity(this.city)

        await this._updateFrame({
            window: { title: this.city.name }
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
        context.city = this.city ?? {};
        this.computeStats(context.city);

        context.financeEntryTypes = financeEntryTypes;
        let treasurySum = (Number(this.city.finances.treasury.currencies.pp) * 100) + (Number(this.city.finances.treasury.currencies.gp) * 10) + Number(this.city.finances.treasury.currencies.sp) + Number(this.city.finances.treasury.currencies.cp / 10)
        let expensesSum = Object.values(this.city.finances.entries).filter(entry => entry.type.key === financeEntryTypes.expense.key).reduce((sum, entry) => sum + entry.value, 0);
        let incomesSum = Object.values(this.city.finances.entries).filter(entry => entry.type.key === financeEntryTypes.income.key).reduce((sum, entry) => sum + entry.value, 0);
        let armiesSum = Object.values(this.city.armies.units).reduce((sum, unit) => sum + (unit.nbr * unit.cost), 0);
        let totalSum = Number(treasurySum) + Number(incomesSum) - Number(expensesSum) - Number(armiesSum)
        context.city.finances.total = {
            "treasury": treasurySum,
            "expenses": expensesSum,
            "incomes": incomesSum,
            "armies": armiesSum,
            "value": totalSum
        }

        context.hasNoPeoples = Object.keys(this.city.population.peoples ?? {}).length < 1;
        context.hasNoBuildings = Object.keys(this.city.buildings ?? {}).length < 1;
        context.hasNoTreasures = Object.keys(this.city.chests ?? {}).length < 1;
        context.hasNoEntries = Object.keys(this.city.finances.entries ?? {}).length < 1;
        context.hasNoUnits = Object.keys(this.city.armies.units ?? {}).length < 1;
        return context;
    }

    computeStats(city) {
        for (const stat of Object.values(city.stats)) {
            stat.value = Number(stat.base) + Number(stat.bonus) - Number(stat.malus);
            stat.malusDisplay = stat.malus === 0 ? 0 : -Math.abs(stat.malus);
        }
    }
}