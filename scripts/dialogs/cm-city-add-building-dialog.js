import { MODULE_ID } from "../common/cm-constants.js"
import { logger } from "../common/cm-customLog.js"

const { FormDataExtended } = foundry.applications.ux;
const { renderTemplate } = foundry.applications.handlebars;
const { DialogV2 } = foundry.applications.api;

export const addBuildingDialog = {
    async render(dataConfig) {
        try {
            const dialogForm = await addBuildingDialog.config(dataConfig)
            return await DialogV2.wait(dialogForm);
        } catch (ex) {
            logger.debug("User did not save building.", ex);
            return;
        }
    },
    async config(dataConfig) {
        let titleTxt = "CM.dialog.newBuilding.title";
        if (dataConfig) {
            titleTxt = "CM.dialog.editBuilding.title"
        }
        const dataForm = dataConfig ?? {
            "name": "CM.dialog.newBuilding.name.default.value",
            "nbr": 0,
            "price": 0,
            "cost": 0
        }
        return {
            window: { title: titleTxt },
            content: await renderTemplate(`modules/${MODULE_ID}/templates/dialogs/cm-city-add-building.hbs`, dataForm),
            buttons: [
                {
                    label: "CM.dialog.save.btn",
                    icon: "fas fa-plus",
                    action: "confirm",
                    callback: async (event, button, dialog) => {
                        const form = button.form;
                        const data = new FormDataExtended(form).object;
                        logger.debug("Submit building", data);

                        if (!data.name?.trim()) {
                            ui.notifications.warn(game.i18n.localize("CM.dialog.newBuilding.emptyName"));
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