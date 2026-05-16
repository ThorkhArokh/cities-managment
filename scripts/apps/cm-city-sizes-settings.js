import { logger } from "../common/cm-customLog.js"
import { MODULE_ID, SETTING_CITY_SIZES_KEY } from "../common/cm-constants.js"
import { CM_CONFIG } from "../common/cm-config.js"

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class CitySizesSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(obj, options = {}) {
        super(options);
        this.sizes = { ...game.settings.get(MODULE_ID, SETTING_CITY_SIZES_KEY) };
    }

    static DEFAULT_OPTIONS = {
        id: "cm-city-sizes-settings",
        tag: "form",
        form: {
            handler: CitySizesSettings.submitFormHandler,
            submitOnChange: true,
            closeOnSubmit: false
        },
        window: {
            title: "CM.settings.citySizes.app.title",
            icon: "fas fa-city",
            resizable: true,
        },
        position: {
            width: 500,
        },
        actions: {
            save: CitySizesSettings.#save,
            addNew: CitySizesSettings.#addNew,
            delete: CitySizesSettings.#delete,
            reset: CitySizesSettings.#reset
        }
    };

    static PARTS = {
        form: {
            template: `modules/${MODULE_ID}/templates/settings/city-sizes-settings.hbs`,
        },
    };

    async _prepareContext(context) {
        logger.debug("CitySizesSettings | _prepareContext...", context)
        context.sizes = Object.entries(this.sizes).map(([key, label]) => ({ key, label }));
        logger.debug("CitySizesSettings | _prepareContext - sizes", this.sizes, context.sizes)
        return context;
    }

    _onRender(context, options) {
        const container = this.element.querySelector("#cm-city-sizes-sortable");
        if (!container) return;
        this.#initDragAndDrop(container);
    }

    #initDragAndDrop(container) {
        let draggedEl = null;

        container.addEventListener("dragstart", (e) => {
            draggedEl = e.target.closest(".cm-cities-app-tab-line");
            if (!draggedEl) return;
            draggedEl.classList.add("cm-dragging");
            e.dataTransfer.effectAllowed = "move";
        });

        container.addEventListener("dragend", () => {
            draggedEl?.classList.remove("cm-dragging");
            draggedEl = null;
            this.#syncOrder();
        });

        container.addEventListener("dragover", (e) => {
            e.preventDefault();
            const target = e.target.closest(".cm-cities-app-tab-line");
            if (!target || target === draggedEl) return;

            const rect = target.getBoundingClientRect();
            const after = e.clientY > rect.top + rect.height / 2;
            container.insertBefore(draggedEl, after ? target.nextSibling : target);
        });

        // Activer le drag sur chaque ligne
        container.querySelectorAll(".cm-cities-app-tab-line").forEach(row => {
            row.setAttribute("draggable", "true");
        });
    }

    #syncOrder() {
        const rows = this.element.querySelectorAll(".cm-cities-app-tab-line");
        const reordered = {};
        logger.debug("syncOrder", rows)
        for (const row of rows) {
            const key = row.dataset.index;
            if (key && Object.hasOwn(this.sizes, key)) {
                reordered[key] = this.sizes[key];
            }
        }
        if (reordered) {
            this.sizes = reordered;
        }
        logger.debug("CitySizesSettings | syncOrder - sizes", this.sizes);
    }

    static async submitFormHandler(event, form, formData) {
        logger.debug("CitySizesSettings | submitFormHandler...", event, form, formData)
        const datas = foundry.utils.expandObject(formData.object);
        logger.debug("CitySizesSettings | submitFormHandler - FormDatas", datas)

        foundry.utils.mergeObject(this.sizes, datas.sizes, {
            insertKeys: true,    // ajouter les clés absentes de objA
            insertValues: true,  // ajouter les valeurs manquantes
            overwrite: true,     // objB écrase objA
            recursive: true,     // fusion récursive des objets imbriqués
            inplace: true,      // false = retourne un nouvel objet
        });

        this.render()
    }

    static async #addNew(event, target) {
        logger.debug("CitySizesSettings | addNew...", event, target)
        const newSizeKey = foundry.utils.randomID();
        this.sizes[newSizeKey] = "newSize";
        this.render();
    }

    static async #delete(event, target) {
        logger.debug("CitySizesSettings | delete...", event, target)
        var sizeKey = target.dataset.key

        if (Object.hasOwn(this.sizes, sizeKey)) {
            delete this.sizes[sizeKey]
            this.render();
        }
    }

    static async #reset(event, target) {
        logger.debug("CitySizesSettings | reset...", event, target)
        this.sizes = foundry.utils.deepClone(CM_CONFIG.city.sizes);
        game.settings.set(MODULE_ID, SETTING_CITY_SIZES_KEY, this.sizes)
        logger.debug("CitySizesSettings | reset - sizes", this.sizes, game.settings.get(MODULE_ID, SETTING_CITY_SIZES_KEY))
        this.render();
    }

    static async #save(event, target) {
        logger.debug("CitySizesSettings | save...", event, target)
        game.settings.set(MODULE_ID, SETTING_CITY_SIZES_KEY, this.sizes)
        this.close()
    }
}