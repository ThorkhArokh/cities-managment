import { logger } from "./common/customLog.js"
import { MODULE_ID, FLAG_KEY } from "./common/constants.js"
import { CitiesTab } from "./sidebar/cities-sidebar-tab.js"
import { registerSystemSettings } from "./common/cm-settings.js"
import { preloadHandlebarsTemplates } from "./common/cm-templates.js"
import { registerHandlebarsHelpers } from "./common/cm-helpers.js"
import { CM_CONFIG } from "./common/cm-config.js";

logger.info(`Module ${MODULE_ID} loaded`);

Hooks.on("init", function () {
  logger.info(`Module ${MODULE_ID} Initializing...`);
  logger.info(`Module ${MODULE_ID} ...config...`);
  CONFIG.CM = CM_CONFIG;

  logger.info(`Module ${MODULE_ID} ...settings...`);
  registerSystemSettings();

  logger.debug("actor classes", CONFIG.Actor.documentClasses)
  logger.debug("actor data models", CONFIG.Actor.dataModels)
  logger.debug("actor types", game.documentTypes.Actor);
  logger.debug("collections", foundry.documents.collections)
  logger.debug("init UI", CONFIG.ui)

  logger.info(`Module ${MODULE_ID} ...sidebar...`);
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

  logger.info(`Module ${MODULE_ID} ...hooks...`);
  Hooks.on("renderSidebar", (app, html) => {
    const citiesmanagmentBtn = html.querySelector('button[data-tab="citiesmanagment"]');
    const citiesmanagmentLi = citiesmanagmentBtn?.closest("li");
    const targetBtn = html.querySelector('button[data-tab="items"]');
    const itemsLi = targetBtn?.closest("li");

    if (citiesmanagmentLi && itemsLi) {
      itemsLi.before(citiesmanagmentLi);
    }
  });

  Hooks.on("renderJournalDirectory", (app, html, data) => {
    logger.debug("Hook : renderJournalDirectory", html)
    for (const journal of game.journal) {
      if (journal.getFlag(MODULE_ID, FLAG_KEY) !== undefined) {
        const entry = html.querySelector(`[data-entry-id="${journal.id}"]`);
        if (entry) entry.remove();
      }
    }
  });

  // Preload Handlebars Templates
  logger.info(`Module ${MODULE_ID} ...templates...`);
  preloadHandlebarsTemplates();

  // Register Handlebars helpers
  logger.info(`Module ${MODULE_ID} ...helpers...`);
  registerHandlebarsHelpers();

  logger.info(`Module ${MODULE_ID} ...Initializing done`);
});

Hooks.on("setup", () => {
  logger.info(`Module ${MODULE_ID} Setup...`);

  logger.debug("setup UI", CONFIG.ui)
  logger.info(`Module ${MODULE_ID} ...Setup done`);
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
  logger.info(`Module ${MODULE_ID} ...Ready done`);
});
