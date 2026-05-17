import { MODULE_ID, IS_DEBUG_MODE, DATAS_STORE, SETTING_CITY_SIZES_KEY } from "./cm-constants.js"
import { CitySizesSettings } from "../apps/cm-city-sizes-settings.js"

const TABS_CONFIG = [
    { id: "stats", labelKey: "CM.app.city.tab.stats.label", icon: "fa-solid fa-scroll" },
    { id: "finances", labelKey: "CM.app.city.tab.finances.label", icon: "fa-solid fa-coins" },
    { id: "armies", labelKey: "CM.app.city.tab.armies.label", icon: "fa-solid fa-shield-halved" },
    { id: "peoples", labelKey: "CM.app.city.tab.peoples.label", icon: "fa-solid fa-people-group" },
    { id: "buildings", labelKey: "CM.app.city.tab.buildings.label", icon: "fa-solid fa-chess-rook" },
    { id: "chests", labelKey: "CM.app.city.tab.chests.label", icon: "fa-solid fa-gem" },
];

export const registerSystemSettings = function () {
    game.settings.registerMenu(MODULE_ID, "citySizesMenu", {
        name: "CM.settings.citySizes.name",
        label: "CM.settings.citySizes.button.edit",
        hint: "CM.settings.citySizes.hint",
        icon: "fas fa-city",
        type: CitySizesSettings,
        restricted: true   // GM seulement
    });

    game.settings.register(MODULE_ID, SETTING_CITY_SIZES_KEY, {
        name: "CM.settings.citySizes.name",
        hint: "CM.settings.citySizes.hint",
        scope: "world",
        config: false,
        type: Object,
        default: CONFIG.CM.city.sizes,
        onChange: () => {
            // Reload CONFIG.CM
            CONFIG.CM.city.sizes = game.settings.get(MODULE_ID, SETTING_CITY_SIZES_KEY);
        }
    });

    game.settings.register(MODULE_ID, "toggleCityEditMode", {
        name: "CM.settings.toggleEdit.name",
        hint: "CM.settings.toggleEdit.hint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    })

    for (const tab of TABS_CONFIG) {
        game.settings.register(MODULE_ID, `tab.${tab.id}.visible`, {
            name: `CM.settings.tabs.${tab.id}.visible.name`,
            hint: `CM.settings.tabs.${tab.id}.visible.hint`,
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            requiresReload: false
        });
    }

    game.settings.register(MODULE_ID, DATAS_STORE, {
        scope: "world",
        config: false,
        type: Object,
        default: {},
    });

    game.settings.register(MODULE_ID, IS_DEBUG_MODE, {
        name: "CM.settings.debugMode.name",
        hint: "CM.settings.debugMode.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    })
}