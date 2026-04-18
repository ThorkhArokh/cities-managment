import { MODULE_ID } from "../common/cm-constants.js"
import { logger } from "../common/cm-customLog.js"

const { FormDataExtended } = foundry.applications.ux;
const { renderTemplate } = foundry.applications.handlebars;
const { DialogV2 } = foundry.applications.api;

export const addArmiesUnitDialog = {
    async render(dialogForm) {
        if (!dialogForm) return
        try {
            return await DialogV2.wait(dialogForm);
        } catch (ex) {
            logger.debug("User did not create new unit.", ex);
            return;
        }
    },
    async config(data) {
        const dataForm = data ?? {}
        return {
            window: { title: "CM.dialog.newUnit.title" },
            content: await renderTemplate(`modules/${MODULE_ID}/templates/dialogs/cm-city-add-armies-unit.hbs`, dataForm),
            buttons: [
                {
                    label: "CM.dialog.newUnit.new.btn",
                    icon: "fas fa-plus",
                    action: "confirm",
                    callback: async (event, button, dialog) => {
                        const form = button.form;
                        const data = new FormDataExtended(form).object;
                        logger.debug("Submit new army unit", data);

                        if (!data.name?.trim()) {
                            ui.notifications.warn(game.i18n.localize("CM.dialog.newUnit.emptyName"));
                            return false;
                        }

                        return data;
                    },
                },
                {
                    label: "CM.dialog.cancel.btn",
                    icon: "fas fa-times",
                    action: "cancel",
                    callback: async (event, button, dialog) => {
                        return false;
                    }
                }
            ],
            rejectClose: false,
        }
    }
} 