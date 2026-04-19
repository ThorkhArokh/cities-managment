export const registerHandlebarsHelpers = function () {
    Handlebars.registerPartial("cityFolderNode", `
    <li class="folder-drop-zone directory-item folder flexcol {{#if node.expanded}}expanded{{/if}}" data-folder-id="{{node.folder.id}}" draggable="true">
      <header class="city-folder folder-header" data-folder-id="{{node.folder.id}}">
        <i class="fas fa-folder{{#if node.expanded}}-open{{/if}}"></i>
        <span class="folder-name" data-folder-id="{{node.folder.id}}">{{node.folder.name}}</span>
        <a class="create-entry" data-action="createEntry" data-folder-id="{{node.folder.id}}">
          <i class="fas fa-plus"></i>
        </a>
      </header>

      {{! Sous-dossiers récursifs }}
      {{#if node.children.length}}
        <ol class="subdirectory">
          {{#each node.children as |child|}}
            {{> cityFolderNode node=child}}
          {{/each}}
        </ol>
      {{/if}}

      {{! Entrées du dossier }}
      {{#if node.entries.length}}
        <ol class="subdirectory plain">
          {{#each node.entries as |city|}}
            {{> cityEntry city=city}}
          {{/each}}
        </ol>
      {{/if}}
    </li>
  `);

    Handlebars.registerPartial("cityEntry", `
    <li class="city-item directory-item entry document flexrow" data-id="{{city.id}}" data-uuid="{{city.uuid}}" draggable="true">
        <img class="thumbnail" src="{{city.flags.cities-managment.cityData.img}}" />
        <a class="entry-name ellipsis" data-action="activateEntry" data-index="{{@index}}"
            data-id="{{city.id}}">{{city.flags.cities-managment.cityData.name}}</a>
    </li>
  `);
}