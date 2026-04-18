import { MODULE_ID, IS_DEBUG_MODE, DATAS_STORE } from "./cm-constants.js"

export const registerSystemSettings = function () {
    game.settings.register(MODULE_ID, IS_DEBUG_MODE, {
        name: "Debug mode actif",
        hint: "Activate debug mode",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    })

    game.settings.register(MODULE_ID, DATAS_STORE, {
        scope: "world",
        config: false,
        type: Object,
        default: {},
    });
}