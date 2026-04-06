import { MODULE_ID } from "../common/constants.js"

const { FormDataExtended } = foundry.applications.ux;
const { renderTemplate } = foundry.applications.handlebars;

export const addFinanceEntryDialog = {
    async config(dataConfig) {
        return {
            window: { title: "CM.app.tab.finances.entries.new.dialog.title" },
            content: await renderTemplate(
                `modules/${MODULE_ID}/templates/dialogs/cm-city-add-finance-entry.hbs`,
                dataConfig
            ),
            buttons: [
                {
                    label: "CM.app.tab.finances.entries.new.dialog.add.btn",
                    icon: "fas fa-plus",
                    action: "confirm",
                    callback: async (event, button, dialog) => {
                        const form = button.form;
                        const data = new FormDataExtended(form).object;
                        logger.debug("Submit new finance entry", data);

                        if (!data.label?.trim()) {
                            ui.notifications.warn(game.i18n.localize("CM.app.tab.finances.entries.new.dialog.checks.label"));
                            return false;
                        }

                        return data;
                    },
                },
                {
                    label: "CM.dialog.cancel.btn",
                    icon: "fas fa-times",
                    action: "cancel",
                }
            ],
            rejectClose: false,
        }
    }
} 