import { MODULE_ID, IS_DEBUG_MODE } from "./constants.js"

const prefixCustom = "CM | "

export const logger = {
    log(message, ...args) { console.log("LOG | " + prefixCustom + message, args) },
    info(message, ...args) { console.info("INFO | " + prefixCustom + message, args) },
    debug(message, ...args) {
        const isDEBUG = game.settings.get(MODULE_ID, IS_DEBUG_MODE)
        if (isDEBUG) {
            console.debug("DEBUG | " + prefixCustom + message, args)
        }
    },
    error(message, ...args) { console.error("ERROR | " + prefixCustom + message, args) }
}
