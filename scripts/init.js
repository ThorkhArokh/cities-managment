import { logger } from "./common/cm-customLog.js"
import { MODULE_ID, FLAG_KEY_CITY_DATAS, FLAG_KEY_TYPE, ENTITY_TYPE_CITY, SETTING_CITY_SIZES_KEY } from "./common/cm-constants.js"
import { CitiesTab } from "./sidebar/cities-sidebar-tab.js"
import { registerSystemSettings } from "./common/cm-settings.js"
import { preloadHandlebarsTemplates } from "./common/cm-templates.js"
import { registerHandlebarsHelpers } from "./common/cm-helpers.js"
import { CM_CONFIG } from "./common/cm-config.js";

logger.info(`Module ${MODULE_ID} loaded`);

Hooks.on("init", function () {
  logger.info(`Module ${MODULE_ID} Initializing...`);
  logger.info(`Module ${MODULE_ID} ...config...`);
  CONFIG.CM = foundry.utils.deepClone(CM_CONFIG);
  logger.info(`Module ${MODULE_ID} ...config...`, CM_CONFIG, CONFIG.CM)

  logger.info(`Module ${MODULE_ID} ...settings...`);
  registerSystemSettings();

  logger.debug("actor classes", CONFIG.Actor.documentClasses)
  logger.debug("actor data models", CONFIG.Actor.dataModels)
  logger.debug("actor types", game.documentTypes.Actor);
  logger.debug("collections", foundry.documents.collections)
  logger.debug("init UI", CONFIG.ui)

  logger.info(`Module ${MODULE_ID} ...sidebar...`);
  // Add a custom sidebar tab
  CONFIG.ui.sidebar.TABS.citiesmanagment = {
    active: false,
    icon: `fa-solid fa-landmark`,
    tooltip: `CM.tab.city-managment`,
  }
  CONFIG.ui.citiesmanagment = CitiesTab
  logger.debug("... sidebar init : ok")

  // Hooks
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
    // Don't show city journal
    for (const journal of game.journal) {
      if (journal.getFlag(MODULE_ID, FLAG_KEY_CITY_DATAS) !== undefined) {
        const entry = html.querySelector(`[data-entry-id="${journal.id}"]`);
        if (entry) entry.remove();
      }
    }
    // Don't show city folders
    for (const folder of game.folders.filter(f => f.type === "JournalEntry")) {
      logger.debug("Hook : renderJournalDirectory folder", folder)
      if (folder.getFlag(MODULE_ID, FLAG_KEY_TYPE) === ENTITY_TYPE_CITY) {
        const entry = html.querySelector(`[data-folder-id="${folder.id}"]`);
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

  // Load city sizes config
  CONFIG.CM.city.sizes = game.settings.get(MODULE_ID, SETTING_CITY_SIZES_KEY);

  logger.debug("Ready UI", ui)
  // Create the tab instance once
  if (!ui.citiesmanagment) {
    ui.citiesmanagment = new CitiesTab();
  }

  // Render once so the tab initializes (required for this Foundry build)
  ui.citiesmanagment.render(true);
  logger.info(`Module ${MODULE_ID} ...Ready done`);
});
