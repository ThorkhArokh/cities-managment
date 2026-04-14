import { MODULE_ID } from "../common/constants.js"
import { logger } from "../common/customLog.js"

const { FormDataExtended } = foundry.applications.ux;
const { renderTemplate } = foundry.applications.handlebars;
const { DialogV2 } = foundry.applications.api;

export const addStatDialog = {
    async render(dialogForm) {
        if(!dialogForm) return
        try {
            return await DialogV2.wait(dialogForm);
        } catch (ex) {
            logger.debug("User did not create new stat.", ex);
            return;
        }
    },
    async config(dataConfig) {
        const dataForm = dataConfig ?? {}
        return {
            window: { title: "CM.dialog.newStat.title" },
            content: await renderTemplate(
                `modules/${MODULE_ID}/templates/dialogs/cm-city-add-stat.hbs`,
                dataForm
            ),
            buttons: [
                {
                    label: "CM.dialog.newStat.new.btn",
                    icon: "fas fa-plus",
                    action: "confirm",
                    callback: async (event, button, dialog) => {
                        const form = button.form;
                        const data = new FormDataExtended(form).object;
                        logger.debug("Submit new stat", data);

                        if (!data.label?.trim()) {
                            ui.notifications.warn(game.i18n.localize("CM.dialog.newStat.emptyLabel"));
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