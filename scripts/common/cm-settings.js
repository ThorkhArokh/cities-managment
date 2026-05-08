import { MODULE_ID, IS_DEBUG_MODE, DATAS_STORE } from "./cm-constants.js"

const TABS_CONFIG = [
    { id: "stats", labelKey: "CM.app.city.tab.stats.label", icon: "fa-solid fa-scroll" },
    { id: "finances", labelKey: "CM.app.city.tab.finances.label", icon: "fa-solid fa-coins" },
    { id: "armies", labelKey: "CM.app.city.tab.armies.label", icon: "fa-solid fa-shield-halved" },
    { id: "peoples", labelKey: "CM.app.city.tab.peoples.label", icon: "fa-solid fa-people-group" },
    { id: "buildings", labelKey: "CM.app.city.tab.buildings.label", icon: "fa-solid fa-chess-rook" },
    { id: "chests", labelKey: "CM.app.city.tab.chests.label", icon: "fa-solid fa-gem" },
];

export const registerSystemSettings = function () {
    game.settings.register(MODULE_ID, IS_DEBUG_MODE, {
        name: "CM.settings.debugMode.name",
        hint: "CM.settings.debugMode.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    })

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
}