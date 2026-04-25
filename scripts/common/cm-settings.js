import { MODULE_ID, IS_DEBUG_MODE, DATAS_STORE } from "./cm-constants.js"

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

    game.settings.register(MODULE_ID, DATAS_STORE, {
        scope: "world",
        config: false,
        type: Object,
        default: {},
    });
}