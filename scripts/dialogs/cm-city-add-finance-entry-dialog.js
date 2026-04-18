import { MODULE_ID } from "../common/cm-constants.js"
import { logger } from "../common/cm-customLog.js"

const { FormDataExtended } = foundry.applications.ux;
const { renderTemplate } = foundry.applications.handlebars;
const { DialogV2 } = foundry.applications.api;

export const addFinanceEntryDialog = {
    async render(dialogForm) {
        if (!dialogForm) return
        try {
            return await DialogV2.wait(dialogForm);
        } catch {
            logger.debug("User did not create new entry.");
            return;
        }
    },
    async config(dataConfig) {
        const dataForm = dataConfig ?? {}
        return {
            window: { title: "CM.app.city.tab.finances.entries.new.dialog.title" },
            content: await renderTemplate(
                `modules/${MODULE_ID}/templates/dialogs/cm-city-add-finance-entry.hbs`,
                dataForm
            ),
            buttons: [
                {
                    label: "CM.app.city.tab.finances.entries.new.dialog.add.btn",
                    icon: "fas fa-plus",
                    action: "confirm",
                    callback: async (event, button, dialog) => {
                        const form = button.form;
                        const data = new FormDataExtended(form).object;
                        logger.debug("Submit new finance entry", data);

                        if (!data.label?.trim()) {
                            ui.notifications.warn(game.i18n.localize("CM.app.city.tab.finances.entries.new.dialog.checks.label"));
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