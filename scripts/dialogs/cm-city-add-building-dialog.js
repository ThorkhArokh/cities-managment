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
        let dataForm = dataConfig ?? {
            "name": "CM.dialog.newBuilding.name.default.value",
            "nbr": 1,
            "price": 0,
            "cost": 0,
            "owner": { id: "", name: "", img: "", uuid: "" }
        }
        return {
            window: { title: titleTxt },
            content: await renderTemplate(`modules/${MODULE_ID}/templates/dialogs/cm-city-add-building.hbs`, dataForm),
            render: (event, dialog) => {
                addBuildingDialog._initOwnerDropZone(dialog.element);
            },
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
    },
    _initOwnerDropZone(html) {
        logger.debug("addBuildingDialog - initOwnerDropZone", html)
        const dropZone = html.querySelector("#owner-drop-zone");
        logger.debug("addBuildingDialog - initOwnerDropZone - dropZone", dropZone)
        if (!dropZone) return;

        const setOwner = (actor) => {
            html.querySelector('[name="ownerUuid"]').value = actor.uuid ?? ""
            html.querySelector('[name="ownerImg"]').value = actor.img ?? ""
            html.querySelector('[name="ownerName"]').value = actor.name ?? ""
            html.querySelector('[name="ownerId"]').value = actor.id ?? ""

            dropZone.dataset.ownerId = actor.id;
            dropZone.innerHTML = `
            <div class="owner-preview flexrow gap8">
                <img src="${actor.img}" alt="${actor.name}" class="cm-img-icon"/>
                <span>${actor.name}</span>
                <button type="button" class="flex0 owner-clear" title="Delete">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            `;

            dropZone.querySelector(".owner-clear").addEventListener("click", () => clearOwner());
        };

        const clearOwner = () => {
            html.querySelector('[name="ownerUuid"]').value = "";
            html.querySelector('[name="ownerId"]').value = "";
            html.querySelector('[name="ownerName"]').value = "";
            html.querySelector('[name="ownerImg"]').value = "";
            dropZone.dataset.ownerId = "";
            dropZone.innerHTML = `<div class="owner-placeholder">
                    <i class="fas fa-user-plus"></i>
                    <span>${game.i18n.localize("CM.dialog.newBuilding.owner.placeholder")}</span>
                </div>`;
        };

        // --- drag & drop ---
        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        dropZone.addEventListener("dragleave", () => {
        });

        dropZone.addEventListener("drop", (e) => {
            logger.debug("addBuildingDialog - drop", e)
            e.preventDefault();

            let data;
            try {
                data = JSON.parse(e.dataTransfer.getData("text/plain"));
            } catch {
                return ui.notifications.warn(game.i18n.localize("CM.dialog.newBuilding.owner.invalidDrop"));
            }

            if (data.type !== "Actor") {
                return ui.notifications.warn(game.i18n.localize("CM.dialog.newBuilding.owner.mustBeActor"));
            }

            const actor = fromUuidSync(data.uuid);
            if (!actor) return;

            setOwner(actor);
        });

        const clearBtn = dropZone.querySelector(".owner-clear");
        if (clearBtn) clearBtn.addEventListener("click", () => clearOwner());
    },
} 