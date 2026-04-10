import { MODULE_ID } from "../common/constants.js"

const { FormDataExtended } = foundry.applications.ux;
const { renderTemplate } = foundry.applications.handlebars;

export const addBuildingDialog = {
    async config(data) {
        return {
            window: { title: "CM.dialog.newBuilding.title" },
            content: await renderTemplate(`modules/${MODULE_ID}/templates/dialogs/cm-city-add-building.hbs`, data),
            buttons: [
                {
                    label: "CM.dialog.newBuilding.new.btn",
                    icon: "fas fa-plus",
                    action: "confirm",
                    callback: async (event, button, dialog) => {
                        const form = button.form;
                        const data = new FormDataExtended(form).object;
                        logger.debug("Submit new building", data);

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
                }
            ],
            rejectClose: false,
        }
    }
} 