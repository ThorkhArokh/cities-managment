import { MODULE_ID } from "../common/cm-constants.js"

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class BuildingItemSheet extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(building, options = {}) {
    super(options);
    this.building = building;
    this.isEditable = game.user.isGM;
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "cm-building-sheet",
    position: {
      width: 600,
      height: 500,
    },
    window: {
      icon: "fa-solid fa-building",
      resizable: true,
    },
    actions: {},
  };

  /** @override */
  static PARTS = {
    header: {
      template: `modules/${MODULE_ID}/templates/items/building/parts/building-header.hbs`,
    },
    tabs: {
      template: "templates/generic/tab-navigation.hbs",
    },
    description: {
      template: `modules/${MODULE_ID}/templates/items/building/parts/building-description.hbs`,
      scrollable: ['']
    },
    details: {
      template: `modules/${MODULE_ID}/templates/items/building/parts/building-details.hbs`,
      scrollable: ['']
    }
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "description", group: "primary", label: "CM.tab.description", icon: "fa-solid fa-book" },
        { id: "details", group: "primary", label: "CM.tab.details", icon: "fa-solid fa-list" },
      ],
      labelPrefix: "CM.app.city.tab", // Optional. Prepended to the id to generate a localization key
      initial: "stats", // Set the initial tab
    }
  };

  /* -------------------------------------------- */
  /*  Préparation des données                      */
  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    return {
      ...context,
      isEditable: this.isEditable,

      // Données spécifiques au building
      building: {
        name: this.building.name,
        img: this.building.img,
        description: this.building.description ?? "Aucune description",
        // Caractéristiques du bâtiment
        type: this.building.buildingType ?? "house",
        condition: this.building.condition ?? 100,
        size: this.building.size ?? "medium",
        capacity: this.building.capacity ?? 0,
        floors: this.building.floors ?? 1,
        // Économie
        cost: this.building.cost ?? 0,
        maintenance: this.building.maintenance ?? 0,
        income: this.building.income ?? 0,
        // Défense
        defense: {
          hp: this.building.defense?.hp ?? 0,
          maxHp: this.building.defense?.maxHp ?? 100,
          armor: this.building.defense?.armor ?? 0,
        },
      },

      // Listes déroulantes
      buildingTypes: this._getBuildingTypes(),
      buildingSizes: this._getBuildingSizes(),
    };
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case "description":
        context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(
          this.building.description ?? "Aucune description",
          { relativeTo: this.building }
        );
        break;
    }

    return context;
  }

  /* -------------------------------------------- */
  /*  Listes de valeurs                            */
  /* -------------------------------------------- */

  _getBuildingTypes() {
    return {
      house: "CM.building.type.house",
      tavern: "CM.building.type.tavern",
      shop: "CM.building.type.shop",
      castle: "CM.building.type.castle",
      temple: "CM.building.type.temple",
      warehouse: "CM.building.type.warehouse",
      tower: "CM.building.type.tower",
      barracks: "CM.building.type.barracks",
    };
  }

  _getBuildingSizes() {
    return {
      small: "CM.building.size.small",
      medium: "CM.building.size.medium",
      large: "CM.building.size.large",
      huge: "CM.building.size.huge",
    };
  }
}