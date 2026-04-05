import { logger } from "./common/customLog.js"
import { MODULE_ID, DATAS_STORE, IS_DEBUG_MODE } from "./common/constants.js"
import { CitiesTab } from "./sidebar/cities-sidebar-tab.js"

logger.info("Module loaded");

Hooks.on("init", function () {
  logger.info(`Module ${MODULE_ID} Initializing...`);

  game.settings.register(MODULE_ID, IS_DEBUG_MODE, {
    name: "Debug mode actif",
    hint: "Activate debug mode",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
  })

  game.settings.register(MODULE_ID, DATAS_STORE, {
    scope: "world",
    config: false,
    type: Object,
    default: {},
  });

  logger.debug("actor classes", CONFIG.Actor.documentClasses)
  logger.debug("data models", CONFIG.Actor.dataModels)
  logger.debug("doc types", game.documentTypes.Actor);
  logger.debug("collections", foundry.documents.collections)

  logger.debug("init UI", CONFIG.ui)
  // Custom sidebar tab
  const Sidebar = foundry?.applications?.sidebar?.Sidebar;
  if (!Sidebar) {
    console.warn(`${MODULE_ID} | Sidebar API not found (v13+ required).`);
    return;
  }

  logger.debug("Sidebar", Sidebar)

  // Register the tab metadata (v13.351-compatible)
  if (!Sidebar.TABS["citiesmanagment"]) {
    logger.debug("tabs", Sidebar.TABS);
    Sidebar.TABS["citiesmanagment"] = {
      icon: "fa-solid fa-landmark",
      tooltip: "CM.tab.city-managment",
      gmOnly: false,

    };
    logger.debug("tabs", Sidebar.TABS);
  }

  Hooks.on("renderSidebar", (app, html) => {
    const citiesmanagmentBtn = html.querySelector('button[data-tab="citiesmanagment"]');
    const citiesmanagmentLi = citiesmanagmentBtn?.closest("li");
    const targetBtn = html.querySelector('button[data-tab="items"]');
    const itemsLi = targetBtn?.closest("li");

    if (citiesmanagmentLi && itemsLi) {
      itemsLi.before(citiesmanagmentLi); 
    }
  });
});

Hooks.on("setup", () => {
  logger.info(`Module ${MODULE_ID} setup...`);

  logger.debug("setup UI", CONFIG.ui)

});

Hooks.on("ready", function () {
  const mod = game.modules.get(MODULE_ID);
  if (!mod) return;
  logger.info(`Module ${MODULE_ID} Ready...`);

  logger.debug("Ready UI", ui)
  // Create the tab instance once
  if (!ui.citiesmanagment) {
    ui.citiesmanagment = new CitiesTab();
  }

  // Render once so the tab initializes (required for this Foundry build)
  ui.citiesmanagment.render(true);
});
