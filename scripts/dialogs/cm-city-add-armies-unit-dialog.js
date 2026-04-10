import { MODULE_ID } from "../common/constants.js"

const { FormDataExtended } = foundry.applications.ux;
const { renderTemplate } = foundry.applications.handlebars;

export const addArmiesUnitDialog = {
    async config(data) {
        return {
            window: { title: "CM.dialog.newUnit.title" },
            content: await renderTemplate(`modules/${MODULE_ID}/templates/dialogs/cm-city-add-armies-unit.hbs`, data),
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
                }
            ],
            rejectClose: false,
        }
    }
} 