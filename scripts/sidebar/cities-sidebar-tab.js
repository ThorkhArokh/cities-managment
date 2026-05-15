import { logger } from "../common/cm-customLog.js"
import { MODULE_ID, FLAG_KEY_TYPE, ENTITY_TYPE_CITY } from "../common/cm-constants.js"
import { CmCitiesJournalDataStore } from "../common/cm-cities-journal-ds.js"
import { CmCityApp } from "../apps/cm-cities-app.js"
import { addCityDialog, deleteFolderDialog } from "../dialogs/cm-cities-tab-dialog.js"

const { DocumentOwnershipConfig } = foundry.applications.apps;
const { DialogV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { AbstractSidebarTab } = foundry.applications.sidebar;
const { ContextMenu } = foundry.applications.ux;

export class CitiesTab extends HandlebarsApplicationMixin(AbstractSidebarTab) {
  _searchQuery = "";
  _sortAlpha = "asc";
  _expandedFolders = new Set();

  static tabName = "citiesmanagment";

  static DEFAULT_OPTIONS = {
    window: { title: "CM.tab.city-managment" },
    classes: ["cm-cities-app", "flexcol"],
    actions: {
      createFolder: CitiesTab.onCreateFolder,
      collapseFolders: CitiesTab.onCollapseFolders,
      createEntry: CitiesTab.onCreateCity,
      activateEntry: CitiesTab.onCityDetails,
      toggleSort: CitiesTab.onToggleSort,
    }
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/sidebar/cities-sidebar-tab.hbs`
    }
  };

  constructor(...args) {
    super(...args);
    logger.debug("Cities Sidebar | constructed");
    this.isEditable = game.user.isGM;
  }

  // --------------------------------------------------------------------
  // HEADER ACTIONS
  // -------------------------------------------------------------------- 
  /**
   * Collapse all folders
   * @param {PointerEvent} event  click event
   * @param {HTMLElement} target  click target
   */
  static onCollapseFolders(event, target) {
    logger.debug("Cities Sidebar | onCollapseFolders", event, target)
    this._expandedFolders.clear();
    this.render();
  }

  // Handler sort button
  static onToggleSort(event, target) {
    this._sortAlpha = this._sortAlpha === "asc" ? "desc" : "asc";
    this.render();
  }

  // Handler search — debounce to don't render for each hit
  #onSearch = foundry.utils.debounce((event) => {
    this._searchQuery = event.target.value;
    this.render();
  }, 200);

  // --------------------------------------------------------------------
  // FOLDERS
  // -------------------------------------------------------------------- 
  /**
   * Create folder
   * @param {PointerEvent} event  click event
   * @param {HTMLElement} target  click target
   */
  static async onCreateFolder(event, target) {
    logger.debug("Cities Sidebar | onCreateFolder", target)
    const button = event.target;
    const li = button.closest(".directory-item");
    const parentId = li?.dataset.folderId;

    // Listen next folder creation, one time
    Hooks.once("createFolder", async (folder) => {
      logger.debug("Cities Sidebar | Hook create folder", folder)
      if (folder.type !== JournalEntry.metadata.name) return;
      await folder.setFlag(MODULE_ID, FLAG_KEY_TYPE, ENTITY_TYPE_CITY);
    });

    Folder.createDialog(
      {
        type: JournalEntry.metadata.name
      },
      { parent: game.folders.get(parentId) ?? null }
    );

    this.render();
  }

  /**
   * Edit folder. Open the folder sheet
   * @param {*} folder the folder to edit
   */
  _onEditFolder(folder) {
    if (!folder) return;
    folder.sheet.render(true);
  }

  /**
   * Delete folder
   * @param {*} folder the folder to delete
   */
  async _onDeleteFolder(folder) {
    logger.debug("Cities Sidebar | onDeleteFolder", folder)
    if (!folder) return;

    const result = await deleteFolderDialog.render(folder);
    if (!result) return;

    logger.debug("Cities Sidebar | onDeleteFolder result", result)
    await folder.delete({
      deleteSubfolders: result === "all",
      deleteContents: result === "all",
    });
  }

  // --------------------------------------------------------------------
  // CITIES
  // -------------------------------------------------------------------- 
  static async onCityDetails(event, target) {
    logger.debug("Cities Sidebar | onCityDetails", target)
    let city = CmCitiesJournalDataStore.getCityById(target.dataset.id)
    // Open city sheet
    new CmCityApp(city).render(true);
  }

  static async onCreateCity(event, target) {
    logger.debug("Cities Sidebar | onCreateCity", event, target)
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const folderId = target.dataset.folderId;

    const newCityName = await addCityDialog.render({
      rect: rect
    });
    if (!newCityName) return;
    if (newCityName.trim() === "") {
      ui.notifications.warn(game.i18n.localize("CM.dialog.newCity.emptyName"));
      return;
    }

    let city = await CmCitiesJournalDataStore.createCity(newCityName, folderId);
    logger.debug("Cities Sidebar | Created city", city)

    // Open city sheet
    new CmCityApp(city, { isEditable: true }).render(true);
    this.render(true);
  }

  // --------------------------------------------------------------------
  // CONTEXT MENUS
  // -------------------------------------------------------------------- 
  _getCityContextMenuItems() {
    return [
      {
        name: "CM.city.contextmenu.ownership",
        label: "CM.city.contextmenu.ownership",
        icon: "<i class='fas fa-lock'></i>",
        visible: (element) => game.user.isGM,
        condition: (element) => game.user.isGM,
        callback: (element) => {
          logger.debug("Cities Sidebar | Callback context menu", element)
          const cityId = element.dataset.id;
          const city = CmCitiesJournalDataStore.getCityById(cityId)
          // FIXME : Ouvre la fenêtre native de configuration des droits
          new DocumentOwnershipConfig({ document: city }).render(true);
        },
        onClick: (element) => {
          logger.debug("Cities Sidebar | onClick context menu item - owernship", element)
          const cityId = element.target.closest("[data-id]")?.dataset.id;
          const city = CmCitiesJournalDataStore.getCityById(cityId)
          // FIXME : Ouvre la fenêtre native de configuration des droits
          new DocumentOwnershipConfig({ document: city }).render(true);
        }
      },
      {
        name: "CM.city.contextmenu.open",
        label: "CM.city.contextmenu.open",
        icon: "<i class='fas fa-edit'></i>",
        callback: (element) => {
          logger.debug("Cities Sidebar | Callback context menu", element)
          const cityId = element.dataset.id;
          const city = CmCitiesJournalDataStore.getCityById(cityId)
          new CmCityApp(city).render(true);
        },
        onClick: (element) => {
          logger.debug("Cities Sidebar | onClick context menu item - edit", element)
          const cityId = element.target.closest("[data-id]")?.dataset.id;
          logger.debug("Cities Sidebar | onClick context menu - edit - id", cityId)
          const city = CmCitiesJournalDataStore.getCityById(cityId)
          new CmCityApp(city).render(true);
        }
      },
      {
        name: "CM.city.contextmenu.delete",
        label: "CM.city.contextmenu.delete",
        icon: "<i class='fas fa-trash'></i>",
        visible: (element) => game.user.isGM,
        condition: (element) => game.user.isGM,
        callback: async (element) => {
          const cityId = element.dataset.id;
          await CmCitiesJournalDataStore.deleteCity(cityId);
          this.render();
        },
        onClick: async (element) => {
          logger.debug("Cities Sidebar | onClick context menu item - delete", element)
          const cityId = element.target.closest("[data-id]")?.dataset.id;
          await CmCitiesJournalDataStore.deleteCity(cityId);
          this.render();
        }
      }
    ];
  }

  _getFolderContextMenuItems() {
    return [
      {
        name: "CM.city.contextmenu.edit",
        label: "CM.city.contextmenu.edit",
        icon: '<i class="fas fa-edit"></i>',
        visible: (element) => {
          logger.debug("Cities Sidebar | visible context menu folder - edit", element)
          const folderId = element.dataset.folderId;
          const folder = game.folders.get(folderId);
          return folder?.isOwner;
        },
        condition: (element) => {
          const folderId = element.dataset.folderId;
          const folder = game.folders.get(folderId);
          return folder?.isOwner;
        },
        onClick: (element) => {
          logger.debug("Cities Sidebar | onClick context menu folder - edit", element)
          const folderId = element.target.closest("[data-folder-id]")?.dataset.folderId;
          const folder = game.folders.get(folderId);
          this._onEditFolder(folder);
        },
        callback: (element) => {
          const folderId = element.dataset.folderId;
          const folder = game.folders.get(folderId);
          this._onEditFolder(folder);
        },
      },
      {
        name: "CM.city.contextmenu.delete",
        label: "CM.city.contextmenu.delete",
        icon: '<i class="fas fa-trash"></i>',
        visible: (element) => {
          logger.debug("Cities Sidebar | visible context menu folder - delete", element)
          const folderId = element.dataset.folderId;
          const folder = game.folders.get(folderId);
          return folder?.isOwner;
        },
        condition: (element) => {
          const folderId = element.dataset.folderId;
          const folder = game.folders.get(folderId);
          return folder?.isOwner;
        },
        onClick: async (element) => {
          logger.debug("Cities Sidebar | onClick context menu folder - delete", element)
          const folderId = element.target.closest("[data-folder-id]")?.dataset.folderId;
          const folder = game.folders.get(folderId);
          this._onDeleteFolder(folder);
        },
        callback: async (element) => {
          logger.debug("Cities Sidebar | Delete folder", element)
          const folderId = element.dataset.folderId;
          const folder = game.folders.get(folderId);
          this._onDeleteFolder(folder);
        }
      },
    ];
  }

  // --------------------------------------------------------------------
  // RENDERING
  // -------------------------------------------------------------------- 
  /** Prepare template context */
  /** After template is rendered */
  async _onRender(context, options) {
    await super._onRender(context, options);
    logger.debug("Cities Sidebar | rendering...", context);

    const searchInput = this.element.querySelector("input[name='search']");

    if (searchInput) {
      searchInput.addEventListener("input", this.#onSearch.bind(this));

      // Put focus
      if (this._searchQuery) {
        searchInput.focus();
        // Put cursor at the end
        searchInput.setSelectionRange(
          searchInput.value.length,
          searchInput.value.length
        );
      }
    }

    // Cities context menu
    new ContextMenu(
      this.element,
      ".city-item",
      this._getCityContextMenuItems(),
      { jQuery: false }
    );

    // Context menu on folders
    new ContextMenu(
      this.element,
      ".city-folder",
      this._getFolderContextMenuItems(),
      { jQuery: false }
    );

    // Toggle expanded when clic on folder header
    this.element.querySelectorAll(".folder-header").forEach(header => {
      header.addEventListener("click", (e) => {
        // Si le clic vient du bouton +, on ignore
        if (e.target.closest(".create-entry")) return;

        const li = e.currentTarget.closest(".folder");
        const folderId = li.dataset.folderId;

        if (this._expandedFolders.has(folderId)) {
          this._expandedFolders.delete(folderId);
        } else {
          this._expandedFolders.add(folderId);
        }

        this.render();
      });
    });

    this._activateDragDrop();
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
    logger.debug(`Cities Sidebar | preparePartContext for ${partId}...`);
    context.isEditable = this.isEditable
    // Cities
    let cities = CmCitiesJournalDataStore.getAllCities();
    logger.debug("Cities Sidebar | cities", cities)

    // Search
    const query = this._searchQuery.trim().toLowerCase();
    let isSearch = false;
    if (query) {
      cities = cities.filter(c => c.name.toLowerCase().includes(query));
      isSearch = true;
    }

    // Sorts
    cities = [...cities].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return this._sortAlpha === "asc" ? cmp : -cmp;
    });

    context.cities = cities.filter(j => j.visible);
    context.searchQuery = this._searchQuery;
    context.sortAlpha = this._sortAlpha;

    // Folders
    context.tree = this._buildTree(context.cities, isSearch);

    logger.debug("Cities Sidebar | Context", context)
    return context;
  }

  /**
   * Build folders and entities tree
   * @param {*} cities cities entities
   * @param {*} isSearch search active or not
   * @returns folders and entities tree
   */
  _buildTree(cities, isSearch) {
    const type = JournalEntry.metadata.name;

    logger.debug("Cities Sidebar | Folders", game.folders)
    // All visible city folders
    const folders = game.folders
      .filter(f => f.type === type && f.getFlag(MODULE_ID, FLAG_KEY_TYPE) === ENTITY_TYPE_CITY)
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

    // All visible entities
    const entries = cities
      .filter(j => j.visible)
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

    // Node recursive build
    const buildNode = (folder) => ({
      folder,
      expanded: isSearch || this._expandedFolders.has(folder.id),
      children: folders
        .filter(f => f.folder?.id === folder.id)
        .map(buildNode),
      entries: entries.filter(j => j.folder?.id === folder.id),
    });

    return {
      // Root folders
      children: folders
        .filter(f => !f.folder)
        .map(buildNode),
      // Root entities
      entries: entries.filter(j => !j.folder),
    };
  }

  // ----------------------------------------------------------------------
  // HOOKS 
  // ----------------------------------------------------------------------
  _onFirstRender(context, options) {
    super._onFirstRender(context, options);
    this._registerHooks();
  }

  async close(options) {
    this._unregisterHooks();
    return super.close(options);
  }

  _registerHooks() {
    const rerender = () => this.render();
    const folderFilter = (folder) => {
      if (folder.type === JournalEntry.metadata.name) rerender();
    };

    this._hooks = [
      { name: "createFolder", id: Hooks.on("createFolder", folderFilter) },
      { name: "updateFolder", id: Hooks.on("updateFolder", folderFilter) },
      { name: "deleteFolder", id: Hooks.on("deleteFolder", folderFilter) },
      { name: "createJournalEntry", id: Hooks.on("createJournalEntry", rerender) },
      { name: "updateJournalEntry", id: Hooks.on("updateJournalEntry", rerender) },
      { name: "deleteJournalEntry", id: Hooks.on("deleteJournalEntry", rerender) },
    ];
  }

  _unregisterHooks() {
    this._hooks?.forEach(({ name, id }) => Hooks.off(name, id));
    this._hooks = [];
  }

  // ----------------------------------------------------------------------
  // DRAG n DROP 
  // ----------------------------------------------------------------------
  _activateDragDrop() {
    const el = this.element;

    // Drag entities
    el.querySelectorAll(".directory-item.document").forEach(item => {
      item.addEventListener("dragstart", this._onDragStart.bind(this));
    });

    // Drag folders
    el.querySelectorAll(".city-folder").forEach(folder => {
      folder.addEventListener("dragstart", this._onFolderDragStart.bind(this));
    });

    // Drop zones on folders
    el.querySelectorAll(".folder-drop-zone").forEach(folder => {
      folder.addEventListener("dragover", this._onDragOver.bind(this));
      folder.addEventListener("dragleave", this._onDragLeave.bind(this));
      folder.addEventListener("drop", this._onDrop.bind(this));
    });

    // Drop zone root
    const list = el.querySelector(".directory-list");
    list?.addEventListener("dragover", this._onDragOver.bind(this));
    list?.addEventListener("dragleave", this._onDragLeave.bind(this));
    list?.addEventListener("drop", this._onDropRoot.bind(this));
  }

  async _onDragStart(event) {
    logger.debug("Cities Sidebar | onDragStart", event)
    const li = event.target;
    const documentId = li.dataset.id;
    const documentUuid = li.dataset.uuid;
    logger.debug("Cities Sidebar | onDragStart UUID", documentId, documentUuid)
    event.dataTransfer.setData("text/plain", JSON.stringify({
      type: "JournalEntry",
      uuid: documentUuid,
      id: documentId
    }));

    event.stopPropagation();
  }

  _onFolderDragStart(event) {
    logger.debug("Cities Sidebar | onFolderDragStart", event)
    const li = event.target;
    const folderId = li.dataset.folderId;

    event.dataTransfer.setData("text/plain", JSON.stringify({
      type: "Folder",
      id: folderId,
    }));

    event.stopPropagation();
  }

  _onDragOver(event) {
    event.preventDefault();
    event.target.classList.add("droptarget");
  }

  _onDragLeave(event) {
    event.target.classList.remove("droptarget");
  }

  async _onDrop(event) {
    logger.debug("Cities Sidebar | onDrop", event)
    event.preventDefault();
    event.stopPropagation();

    const target = event.target;
    target.classList.remove("droptarget");

    const folderId = target.dataset.folderId;
    const folder = game.folders.get(folderId);
    if (!folder) return;

    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch { return; }

    // Drop d'une entrée dans un dossier
    if (data.type === "JournalEntry") {
      logger.debug("Cities Sidebar | onDrop JournalEntry", data.id)
      const journal = game.journal.get(data.id);
      if (!journal?.isOwner) return;

      await journal.update({ folder: folderId });
    }

    // Drop d'un dossier dans un dossier
    if (data.type === "Folder") {
      logger.debug("Cities Sidebar | onDrop Folder", data.id)
      if (data.id === folderId) return; // pas sur lui-même
      const draggedFolder = game.folders.get(data.id);
      if (!draggedFolder?.isOwner) return;

      await draggedFolder.update({ folder: folderId });
    }
  }

  // Drop à la racine (hors dossier)
  async _onDropRoot(event) {
    logger.debug("Cities Sidebar | onDropRoot", event)
    event.preventDefault();

    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch { return; }

    if (data.type === "JournalEntry") {
      const journal = game.journal.get(data.id);
      if (!journal?.isOwner) return;
      await journal.update({ folder: null });
    }

    if (data.type === "Folder") {
      const folder = game.folders.get(data.id);
      if (!folder?.isOwner) return;
      await folder.update({ folder: null });
    }
  }
}