import { logger } from "../common/customLog.js"
import { MODULE_ID } from "../common/constants.js"
import { CmDataStore } from "../common/cm-data-store.js"
import { CityDto } from "../model/cm-city-dto.js"
import { CmCityApp } from "../actor/cm-city-app.js"

const { DialogV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { AbstractSidebarTab } = foundry.applications.sidebar;
const { ContextMenu } = foundry.applications.ux;

export class CitiesTab extends HandlebarsApplicationMixin(AbstractSidebarTab) {
  static tabName = "citiesmanagment";

  static DEFAULT_OPTIONS = {
    window: { title: "CM.tab.city-managment" },
    classes: ["cm-cities-app", "flexcol"],
    actions: {
      createEntry: CitiesTab.onCreateCity,
      activateEntry: CitiesTab.onCityDetails,
      deleteAllEntry: CitiesTab.onDeleteAll,
    }
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/sidebar/cities-sidebar-tab.hbs`
    }
  };

  constructor(...args) {
    super(...args);
    logger.debug("CitiesTab constructed");
  }

  static async onDeleteAll(event, target) {
    logger.debug("onDeleteAll", target)
    await CmDataStore.deleteAllCities();
    this.render(true)
  }

  static async onCityDetails(event, target) {
    logger.debug("onCityDetails", target)
    var city = CmDataStore.getCityById(target.dataset.id);
    var cityApp = new CmCityApp(city)
    cityApp.render(true);
  }

  static async onCreateCity(event, target) {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const result = await DialogV2.prompt({
      window: { title: game.i18n.localize("CM.dialog.newCity.title") },
      position: {
        left: rect.left - 320,
        top: rect.top,
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

    if (!result) return;
    if (result.trim() === "") {
      ui.notifications.warn(game.i18n.localize("CM.dialog.newCity.emptyName"));
      return;
    }

    var city = new CityDto(result)

    logger.debug("city", city)

    await CmDataStore.addCity(city)
    logger.debug("Created city", city)

    // Ouvre automatiquement la fiche du nouvel acteur
    var cityApp = new CmCityApp(city)
    cityApp.render(true);
    this.render(true);
  }

  /** Prepare template context */
  /** After template is rendered */
  async _onRender(context, options) {
    await super._onRender(context, options);
    logger.debug("CitiesTab rendering...", context);

    // Cities context menu
    new ContextMenu(
      this.element,
      ".city-item",
      this._getCityContextMenuItems(),
      { jQuery: false }
    );
  }

  _getCityContextMenuItems() {
    return [
      {
        name: game.i18n.localize("CM.city.contextmenu.open"),
        icon: "<i class='fas fa-edit'></i>",
        callback: (element) => {
          logger.debug("Callback context menu", element)
          const cityId = element.dataset.id;
          const city = CmDataStore.getCityById(cityId);
          new CmCityApp(city).render(true);
        }
      },
      {
        name: game.i18n.localize("CM.city.contextmenu.delete"),
        icon: "<i class='fas fa-trash'></i>",
        condition: (element) => game.user.isGM,
        callback: async (element) => {
          const cityId = element.dataset.id;
          await CmDataStore.deleteCity(cityId);
          this.render();
        }
      }
    ];
  }

  /**
* Prepare context that is specific to only a single rendered part.
*
* It is recommended to augment or mutate the shared context so that downstream methods like _onRender have
* visibility into the data that was used for rendering. It is acceptable to return a different context object
* rather than mutating the shared context at the expense of this transparency.
*
* @param {string} partId                         The part being rendered
* @param {ApplicationRenderContext} context      Shared context provided by _prepareContext
* @returns {Promise<ApplicationRenderContext>}   Context data for a specific part
* @protected
*/
  async _preparePartContext(partId, context) {
    logger.debug(`CitiesTab preparePartContext for ${partId}...`);

    context.cities = CmDataStore.getCities();

    logger.debug("cities", context.cities)
    return context;
  }
}