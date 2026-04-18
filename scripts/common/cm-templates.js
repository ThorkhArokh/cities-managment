import { MODULE_ID } from "./cm-constants.js"

/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {

    // Define template paths to load
    const templatePaths = [
        // SIDEBAR
        `modules/${MODULE_ID}/templates/sidebar/cities-sidebar-tab.hbs`,

        // CITY
        `modules/${MODULE_ID}/templates/city/parts/cm-city-stats.tab.hbs`,
        `modules/${MODULE_ID}/templates/city/parts/cm-city-peoples-tab.hbs`,
        `modules/${MODULE_ID}/templates/city/parts/cm-city-header.hbs`,
        `modules/${MODULE_ID}/templates/city/parts/cm-city-finances-tab.hbs`,
        `modules/${MODULE_ID}/templates/city/parts/cm-city-chests-tab.hbs`,
        `modules/${MODULE_ID}/templates/city/parts/cm-city-buildings-tab.hbs`,
        `modules/${MODULE_ID}/templates/city/parts/cm-city-armies-tab.hbs`,

        // DIALOGS
        `modules/${MODULE_ID}/templates/dialogs/cm-city-add-armies-unit.hbs`,
        `modules/${MODULE_ID}/templates/dialogs/cm-city-add-finance-entry.hbs`
    ];

    // Load the template parts
    return foundry.applications.handlebars.loadTemplates(templatePaths);
};
