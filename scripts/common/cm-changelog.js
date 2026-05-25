import { logger } from "./cm-customLog.js"
import { MODULE_ID, IS_DEBUG_MODE } from "./cm-constants.js"

export async function writeChangeLog() {
    if (game.user.isGM) {
        const currentVersion = game.modules.get(MODULE_ID)?.version ?? "0.0.0";
        const lastSeen = game.settings.get(MODULE_ID, "lastSeenVersion");
        logger.debug("Hooks | Ready - version : current ?= last", currentVersion, lastSeen)

        const isDEBUG = game.settings.get(MODULE_ID, IS_DEBUG_MODE)
        if (!isDEBUG && lastSeen === currentVersion) return;

        const section = await _loadChangelog(currentVersion);
        if (!section) return;

        const htmlTitle = `<b>🆕 Cities-managment — v${currentVersion}</b>
      <p>Here are the new features of this version : </p>`
        const content = _markdownToHtml(_replaceGithubEmojis(section));
        const footer = `<hr> <a href="https://ko-fi.com/Z8Z11YI46Z"><img  src="https://ko-fi.com/img/githubbutton_sm.svg" style="height:25px"/></a>`
        const html = htmlTitle + content + footer;
        logger.debug("Hooks | Ready - change log message", html)

        // Post message only to GM
        await ChatMessage.create({
            content: html,
            whisper: [game.user.id],
            speaker: { alias: "Cities-managment" },
        });

        // Save new version after post
        await game.settings.set(MODULE_ID, "lastSeenVersion", currentVersion);
    }
}

async function _loadChangelog(version) {
    const response = await fetch(`modules/${MODULE_ID}/CHANGELOG.md`);
    if (!response.ok) {
        console.warn(`${MODULE_ID} | CHANGELOG.md not found`);
        return;
    }

    const fullText = await response.text();
    return _extractChangeLogVersionContent(fullText, version)
}

function _extractChangeLogVersionContent(changelog, version) {
    const lines = changelog.split(/\r?\n/);
    const startPattern = new RegExp(`^###\\s*\\[v?${version}\\]`);

    let inSection = false;
    const result = [];

    for (const line of lines) {
        if (startPattern.test(line)) {
            inSection = true;
            continue;
        }
        if (inSection && /^###\s*\[/.test(line)) break;
        if (inSection && line.trim() !== "") result.push(line);
    }

    if (!result.length) {
        console.warn(`${MODULE_ID} | No section found for v${version}`);
        return null;
    }

    return result.join("\n");
}

function _replaceGithubEmojis(text) {
    const emojis = {
        ":bug:": "🐛",
        ":sparkles:": "✨",
        ":globe_with_meridians:": "🌐",
        ":book:": "📖",
        ":clipboard:": "📋",
        ":wrench:": "🔧",
        ":fire:": "🔥",
        ":zap:": "⚡",
        ":lock:": "🔒",
        ":arrow_up:": "⬆️",
    };

    return text.replace(/:[\w]+:/g, (match) => emojis[match] ?? match);
}

function _markdownToHtml(text) {
    return text
        // ### [titre](url) → <h3><a>titre</a></h3>
        .replace(/### \[([^\]]+)\]\(([^)]+)\)/g, '<h3><a href="$2" target="_blank" rel="nofollow noopener">$1</a></h3>')
        // [texte](url) → <a>texte</a>
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="nofollow noopener">$1</a>')
        // - item → <li>item</li>
        .replace(/^ ?- (.+)$/gm, "<li>$1</li>")
        // Groupes de <li> → <ul>
        .replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, (match) => `<ul>${match}</ul>`)
        // Nettoie les lignes vides
        .replace(/\n{2,}/g, "\n");
}
