import { MODULE_ID } from "../common/cm-constants.js"
import { logger } from "../common/cm-customLog.js"

const { FormDataExtended } = foundry.applications.ux;
const { renderTemplate } = foundry.applications.handlebars;
const { DialogV2 } = foundry.applications.api;

export const addStatDialog = {
    async render(dialogForm) {
        if (!dialogForm) return
        try {
            return await DialogV2.wait(dialogForm);
        } catch (ex) {
            logger.debug("User did not create new stat.", ex);
            return;
        }
    },
    async config(dataConfig) {
        let titleTxt = "CM.dialog.newStat.title";
        if (dataConfig) {
            titleTxt = "CM.dialog.editStat.title"
        }
        const dataForm = dataConfig ?? {
            "base": 0,
            "bonus": 0,
            "malus": 0
        }
        logger.debug("DataForm", dataForm)
        return {
            window: { title: titleTxt },
            content: await renderTemplate(
                `modules/${MODULE_ID}/templates/dialogs/cm-city-add-stat.hbs`,
                dataForm
            ),
            actions: {
                addBaseToRoll: async (event, target) => {
                    logger.debug("addBaseToRoll", target.dataset);
                    const dialog = target.closest(".application");
                    const rollFormulaElement = dialog.querySelector("[name='rollFormula']");
                    logger.debug("Elements", dialog, rollFormulaElement)
                    let value = rollFormulaElement.value ?? 0
                    rollFormulaElement.value = value + " + @base"
                },
                addBonusToRoll: async (event, target) => {
                    logger.debug("addBonusToRoll", target.dataset);
                    const dialog = target.closest(".application");
                    const rollFormulaElement = dialog.querySelector("[name='rollFormula']");
                    logger.debug("Elements", dialog, rollFormulaElement)
                    let value = rollFormulaElement.value ?? 0
                    rollFormulaElement.value = value + " + @bonus"
                },
                addMalusToRoll: async (event, target) => {
                    logger.debug("addMalusToRoll", target.dataset);
                    const dialog = target.closest(".application");
                    const rollFormulaElement = dialog.querySelector("[name='rollFormula']");
                    logger.debug("Elements", dialog, rollFormulaElement)
                    let value = rollFormulaElement.value ?? 0
                    rollFormulaElement.value = value + " - @malus"
                }
            },
            buttons: [
                {
                    label: "CM.dialog.save.btn",
                    icon: "fas fa-save",
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