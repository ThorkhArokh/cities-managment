import { MODULE_ID } from "../common/cm-constants.js"
import { logger } from "../common/cm-customLog.js"

const { FormDataExtended } = foundry.applications.ux;
const { renderTemplate } = foundry.applications.handlebars;
const { DialogV2 } = foundry.applications.api;

export const addArmiesUnitDialog = {
    async render(dataConfig) {
        try {
            const dialogForm = await addArmiesUnitDialog.config(dataConfig)
            return await DialogV2.wait(dialogForm);
        } catch (ex) {
            logger.debug("User did not save unit.", ex);
            return;
        }
    },
    async config(dataConfig) {
        let titleTxt = "CM.dialog.newUnit.title";
        if (dataConfig) {
            titleTxt = "CM.dialog.newUnit.title"
        }
        const dataForm = dataConfig ?? {
            "name": "CM.dialog.newUnit.name.default.value",
            "role": "CM.dialog.newUnit.role.default.value",
            "nbr": 1,
            "cost": 0
        }
        return {
            window: { title: titleTxt },
            content: await renderTemplate(`modules/${MODULE_ID}/templates/dialogs/cm-city-add-armies-unit.hbs`, dataForm),
            buttons: [
                {
                    label: "CM.dialog.save.btn",
                    icon: "fas fa-plus",
                    action: "confirm",
                    callback: async (event, button, dialog) => {
                        const form = button.form;
                        const data = new FormDataExtended(form).object;
                        logger.debug("Submit army unit", data);

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