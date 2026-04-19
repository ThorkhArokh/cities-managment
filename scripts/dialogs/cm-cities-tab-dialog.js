const { DialogV2 } = foundry.applications.api;

export const addCityDialog = {
    async render(dialogForm) {
        return await DialogV2.prompt({
            window: { title: game.i18n.localize("CM.dialog.newCity.title") },
            position: {
                left: dialogForm.rect.left - 320,
                top: dialogForm.rect.top,
                width: 300,
            },
            content: `
                    <div class="form-group">
                        <label>${game.i18n.localize("CM.dialog.newCity.label")}</label>
                        <input type="text" name="cityName" placeholder="${game.i18n.localize("CM.dialog.newCity.placeholder")}" autofocus />
                    </div>
                `,
            ok: {
                label: game.i18n.localize("CM.dialog.newCity.create"),
                callback: (event, button, dialog) => {
                    return button.form.elements.cityName.value;
                }
            }
        });
    }
}

export const deleteFolderDialog = {
    async render(dialogForm) {
        return await DialogV2.wait({
            window: { title: game.i18n.localize("CM.dialog.deleteFolder.title") + `${dialogForm.name}` },
            content: game.i18n.localize("CM.dialog.deleteFolder.content"),
            buttons: [
                {
                    label: "CM.dialog.deleteFolder.btn.deleteAll",
                    icon: "fas fa-trash",
                    action: "all",
                },
                {
                    label: "CM.dialog.deleteFolder.btn.keepContent",
                    icon: "fas fa-folder-minus",
                    action: "keep",
                },
                {
                    label: "CM.dialog.cancel.btn",
                    icon: "fas fa-times",
                    action: "cancel",
                    callback: async (event, button, dialog) => {
                        return false;
                    }
                },
            ],
        });
    }
}