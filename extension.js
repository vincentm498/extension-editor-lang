const vscode = require('vscode');

// ─── Formatter ───────────────────────────────────────────────────────────────

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

function formatTemplateBlock(block) {
  // No-arg directives
  if (/^\[%\s*(dropzone|id)\s*%\]$/.test(block)) return block;

  const m = block.match(/^\[%\s*(input|textarea|select|file|image|color|texteditor|radio|var)\s*\(([\s\S]*)\)\s*%\]$/);
  if (!m) return block;

  const [, funcName, argsStr] = m;

  let obj;
  try { obj = JSON.parse(argsStr.trim()); } catch { return block; }

  // Always expanded: tabs, arrays and objects fully unrolled
  const json = JSON.stringify(obj, null, '\t');
  return `[% ${funcName}(${json}) %]`;
}

function formatDocument(text) {
  // Step 1: format and mask each [% ... %] block
  const placeholders = [];
  const masked = text.replace(/\[%[\s\S]*?%\]/g, (match) => {
    const formatted = formatTemplateBlock(match);
    const idx = placeholders.length;
    placeholders.push(formatted);
    return `___TMPL${idx}___`;
  });

  // Step 2: HTML indentation
  const htmlFormatted = htmlIndent(masked);

  // Step 3: class="..." → class='...'
  const singleQuoted = htmlFormatted.replace(/\bclass="([^"]*)"/g, (_, val) => `class='${val}'`);

  // Step 4: restore placeholders — standalone get their line indent on every line,
  // inline get their parent line's indent prepended to all lines after the first
  return singleQuoted.replace(/^([ \t]*)___TMPL(\d+)___|___TMPL(\d+)___/gm, (_, indent, i1, i2, offset, str) => {
    if (i1 !== undefined) {
      // Standalone: same indent for every line
      const block = placeholders[Number(i1)];
      const lines = block.split('\n');
      if (lines.length === 1) return indent + block;
      return lines.map(line => indent + line).join('\n');
    }
    // Inline: first line stays as-is, subsequent lines get the parent line's indent
    const block = placeholders[Number(i2)];
    const lines = block.split('\n');
    if (lines.length === 1) return block;
    const lineStart = str.lastIndexOf('\n', offset - 1) + 1;
    const lineIndent = (str.slice(lineStart).match(/^([ \t]*)/) || ['', ''])[1];
    return [lines[0], ...lines.slice(1).map(line => lineIndent + line)].join('\n');
  });
}

function htmlIndent(html) {
  const tab = '\t';
  const lines = html.split('\n').map(l => l.trim()).filter((l, i, arr) => {
    return l !== '' || (i > 0 && arr[i - 1] !== '');
  });

  let depth = 0;
  let inOpenTag = false;
  let openTagDepth = 0;
  const result = [];

  for (const line of lines) {
    if (!line) {
      result.push('');
      continue;
    }

    // Inside a multi-line opening tag: lines are attributes or the closing >
    if (inOpenTag) {
      if (line === '>' || line === '/>') {
        // Bare closing on its own line
        result.push(tab.repeat(openTagDepth) + line);
        inOpenTag = false;
        depth = line === '/>' ? openTagDepth : openTagDepth + 1;
      } else if (line.endsWith('/>')) {
        // Last attribute line, self-closing tag
        result.push(tab.repeat(openTagDepth + 1) + line);
        inOpenTag = false;
        depth = openTagDepth;
      } else if (line.endsWith('>')) {
        // Last attribute line that closes the opening tag (e.g. foo='bar'> or ___TMPL___'>)
        result.push(tab.repeat(openTagDepth + 1) + line);
        inOpenTag = false;
        depth = openTagDepth + 1;
      } else {
        result.push(tab.repeat(openTagDepth + 1) + line);
      }
      continue;
    }

    // Closing tag at start → decrease before printing
    const closingMatch = line.match(/^<\/([a-zA-Z][a-zA-Z0-9-]*)/);
    if (closingMatch) {
      depth = Math.max(0, depth - 1);
    }

    result.push(tab.repeat(depth) + line);

    // Detect multi-line tag: starts with <tag but has no > on this line
    const startsTag = !closingMatch && line.match(/^<([a-zA-Z][a-zA-Z0-9-]*)/);
    if (startsTag && !line.includes('>')) {
      inOpenTag = true;
      openTagDepth = depth;
      continue;
    }

    // Normal depth tracking for complete single-line tags
    const opens = [...line.matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)[\s>\/]/g)]
      .filter(m => !VOID_TAGS.has(m[1].toLowerCase()) && !line.includes('/>'))
      .length;
    const closes = [...line.matchAll(/<\/([a-zA-Z][a-zA-Z0-9-]*)\s*>/g)].length;
    const netOpen = opens - closes;

    if (closingMatch) {
      depth += Math.max(0, netOpen + 1);
    } else {
      depth += Math.max(0, netOpen);
    }
  }

  return result.join('\n');
}

// ─── Completion Provider ─────────────────────────────────────────────────────

const DIRECTIVES = [
  {
    label: 'input',
    detail: 'Champ texte modifiable',
    insertText: new vscode.SnippetString(
      'input({"name": "${1:name}", "label": "${2:Label}", "defaultValue": "${3:Valeur}"})'
    )
  },
  {
    label: 'textarea',
    detail: 'Zone de texte modifiable',
    insertText: new vscode.SnippetString(
      'textarea({"name": "${1:name}", "label": "${2:Label}", "defaultValue": "${3:Valeur}"})'
    )
  },
  {
    label: 'select',
    detail: 'Liste déroulante',
    insertText: new vscode.SnippetString(
      'select({"name": "${1:name}", "label": "${2:Label}", "defaultValue": "${3:val}", "options": [{"label": "${4:Option}", "value": "${3:val}"}]})'
    )
  },
  {
    label: 'radio',
    detail: 'Boutons radio',
    insertText: new vscode.SnippetString(
      'radio({"name": "${1:name}", "label": "${2:Label}", "defaultValue": "${3:val}", "options": [{"label": "${4:Option}", "value": "${3:val}"}]})'
    )
  },
  {
    label: 'color',
    detail: 'Sélecteur de couleur',
    insertText: new vscode.SnippetString(
      'color({"name": "${1:name}", "label": "${2:Label}", "defaultValue": "${3:#000000}"})'
    )
  },
  {
    label: 'texteditor',
    detail: 'Éditeur de texte riche',
    insertText: new vscode.SnippetString(
      'texteditor({"name": "${1:name}", "label": "${2:Label}", "defaultValue": "${3:Texte}"})'
    )
  },
  {
    label: 'file',
    detail: 'Lien vers un fichier',
    insertText: new vscode.SnippetString(
      'file({"name": "${1:name}", "label": "${2:Label}", "defaultValue": "${3:https://}"})'
    )
  },
  {
    label: 'image',
    detail: 'Image responsive',
    insertText: new vscode.SnippetString(
      'image({"name": "${1:name}", "defaultValue": [{"url": "${2:https://}", "size": "original"}], "classTagPicture": "${3:}", "classTagImage": "${4:}", "formats": []})'
    )
  },
  {
    label: 'var',
    detail: 'Référence à une variable',
    insertText: new vscode.SnippetString(
      'var({"name": "${1:name}", "defaultValue": "${2:valeur}"})'
    )
  },
  {
    label: 'dropzone',
    detail: 'Zone pour insérer des blocs enfants',
    insertText: new vscode.SnippetString('dropzone')
  },
  {
    label: 'id',
    detail: "Référence à l'id du bloc",
    insertText: new vscode.SnippetString('id')
  }
];

// ─── Directive docs (hover + signature help) ────────────────────────────────

const DIRECTIVE_DOCS = {
  input: {
    description: 'Champ texte modifiable',
    params: [
      { name: 'name', type: 'string', required: true, detail: 'Identifiant du champ' },
      { name: 'label', type: 'string', required: false, detail: 'Libellé affiché dans l\'éditeur' },
      { name: 'defaultValue', type: 'string', required: false, detail: 'Valeur affichée si le champ est vide' },
    ]
  },
  textarea: {
    description: 'Zone de texte modifiable',
    params: [
      { name: 'name', type: 'string', required: true, detail: 'Identifiant du champ' },
      { name: 'label', type: 'string', required: false, detail: 'Libellé affiché dans l\'éditeur' },
      { name: 'defaultValue', type: 'string', required: false, detail: 'Valeur affichée si le champ est vide' },
    ]
  },
  select: {
    description: 'Liste déroulante',
    params: [
      { name: 'name', type: 'string', required: true, detail: 'Identifiant du select' },
      { name: 'label', type: 'string', required: false, detail: 'Libellé affiché dans l\'éditeur' },
      { name: 'defaultValue', type: 'string', required: true, detail: 'Doit correspondre à une valeur des options' },
      { name: 'options', type: 'Array<{label, value}> | string[]', required: true, detail: 'Liste des options sélectionnables' },
    ]
  },
  radio: {
    description: 'Boutons radio',
    params: [
      { name: 'name', type: 'string', required: true, detail: 'Identifiant du champ' },
      { name: 'label', type: 'string', required: false, detail: 'Libellé affiché dans l\'éditeur' },
      { name: 'defaultValue', type: 'string', required: true, detail: 'Doit correspondre à une valeur des options' },
      { name: 'options', type: 'Array<{label, value}>', required: true, detail: 'Liste des options' },
    ]
  },
  color: {
    description: 'Sélecteur de couleur',
    params: [
      { name: 'name', type: 'string', required: true, detail: 'Identifiant du champ' },
      { name: 'label', type: 'string', required: false, detail: 'Libellé affiché dans l\'éditeur' },
      { name: 'defaultValue', type: 'string', required: false, detail: 'Valeur CSS de couleur (ex: #ff0000)' },
    ]
  },
  texteditor: {
    description: 'Éditeur de texte riche (HTML)',
    params: [
      { name: 'name', type: 'string', required: true, detail: 'Identifiant du champ' },
      { name: 'label', type: 'string', required: false, detail: 'Libellé affiché dans l\'éditeur' },
      { name: 'defaultValue', type: 'string', required: false, detail: 'Contenu HTML par défaut' },
    ]
  },
  file: {
    description: 'Lien vers un fichier hébergé sur le serveur ou une URL',
    params: [
      { name: 'name', type: 'string', required: true, detail: 'Identifiant du champ' },
      { name: 'label', type: 'string', required: false, detail: 'Libellé affiché dans l\'éditeur' },
      { name: 'defaultValue', type: 'string', required: false, detail: 'URL ou chemin par défaut' },
    ]
  },
  image: {
    description: 'Image responsive (génère une balise <picture>)',
    params: [
      { name: 'name', type: 'string', required: true, detail: 'Identifiant du champ' },
      { name: 'defaultValue', type: 'Array<{url, size}>', required: true, detail: 'size: sm|md|lg|xl|2xl|original' },
      { name: 'classTagPicture', type: 'string', required: false, detail: 'Classes CSS sur la balise <picture>' },
      { name: 'classTagImage', type: 'string', required: false, detail: 'Classes CSS sur la balise <img>' },
      { name: 'formats', type: 'Array<{size, extension, breakpoint}>', required: false, detail: 'Formats responsive (ex: 750w)' },
    ]
  },
  var: {
    description: 'Référence à la valeur d\'un autre champ',
    params: [
      { name: 'name', type: 'string', required: true, detail: 'Nom du champ à référencer' },
      { name: 'defaultValue', type: 'string', required: false, detail: 'Valeur affichée si le champ est vide' },
    ]
  },
  dropzone: { description: 'Zone pour insérer des blocs enfants', params: [] },
  id: { description: 'Variable qui fait référence à l\'id du bloc', params: [] },
};

function buildHoverDoc(name) {
  const doc = DIRECTIVE_DOCS[name];
  if (!doc) return null;
  const md = new vscode.MarkdownString();
  md.isTrusted = true;
  md.appendMarkdown(`### \`${name}\`\n${doc.description}\n\n`);
  if (doc.params.length > 0) {
    md.appendMarkdown('| Paramètre | Type | Requis | Description |\n|---|---|---|---|\n');
    for (const p of doc.params) {
      md.appendMarkdown(`| \`${p.name}\` | \`${p.type}\` | ${p.required ? '✓' : '—'} | ${p.detail} |\n`);
    }
  }
  return md;
}

function getDirectiveAtPosition(document, position) {
  const text = document.getText();
  const offset = document.offsetAt(position);

  // Find enclosing [% ... %]
  let start = text.lastIndexOf('[%', offset);
  if (start === -1) return null;
  let end = text.indexOf('%]', start);
  if (end === -1 || end < offset) return null;

  const block = text.slice(start, end + 2);
  const m = block.match(/^\[%\s*(input|textarea|select|file|image|color|texteditor|radio|var|dropzone|id)\b/);
  return m ? m[1] : null;
}

function isInsideTemplateTag(document, position) {
  const lineText = document.lineAt(position).text;
  const charsBefore = lineText.substring(0, position.character);
  const lastOpen = charsBefore.lastIndexOf('[%');
  if (lastOpen === -1) return false;
  const lastClose = charsBefore.lastIndexOf('%]');
  return lastClose < lastOpen;
}

// ─── Changelog notification ──────────────────────────────────────────────────

const CHANGELOG = [
  { version: '0.1.6', notes: 'Correction indentation des blocs inline dans les attributs multi-lignes\nCorrection détection fermeture de tag multi-ligne (foo=\'bar\'>)' },
  { version: '0.1.5', notes: 'Désactivation des validations HTML/CSS parasites sur les fichiers .editor' },
  { version: '0.1.4', notes: 'Directives toujours développées par option, y compris dans les attributs HTML' },
  { version: '0.1.3', notes: 'Correction restauration placeholders inline\nCorrection détection attributs multi-lignes' },
  { version: '0.1.2', notes: 'Format à la sauvegarde automatique\nIndentation par tabulations\nAttributs multi-lignes\nclass=\'…\' en guillemets simples' },
];

function showChangelogIfUpdated(context) {
  const ext = vscode.extensions.getExtension('local.editor-lang');
  const current = ext ? ext.packageJSON.version : null;
  if (!current) return;

  const lastSeen = context.globalState.get('editorLangLastVersion');
  if (lastSeen === current) return;

  context.globalState.update('editorLangLastVersion', current);

  const entry = CHANGELOG.find(c => c.version === current);
  const detail = entry ? entry.notes : 'Voir le CHANGELOG pour les détails.';

  vscode.window.showInformationMessage(
    `Editor Lang mis à jour (v${current})`,
    'Voir les nouveautés'
  ).then(choice => {
    if (choice === 'Voir les nouveautés') {
      const uri = vscode.Uri.joinPath(context.extensionUri, 'CHANGELOG.md');
      vscode.commands.executeCommand('markdown.showPreview', uri);
    }
  });

  vscode.window.setStatusBarMessage(`Editor Lang v${current} — ${detail.split('\n')[0]}`, 8000);
}

function activate(context) {
  showChangelogIfUpdated(context);

  // Formatter
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider('editor-lang', {
      provideDocumentFormattingEdits(document) {
        const text = document.getText();
        const formatted = formatDocument(text);
        if (formatted === text) return [];
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(text.length)
        );
        return [vscode.TextEdit.replace(fullRange, formatted)];
      }
    })
  );

  // Autocomplete
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      'editor-lang',
      {
        provideCompletionItems(document, position) {
          if (!isInsideTemplateTag(document, position)) return [];
          return DIRECTIVES.map(d => {
            const item = new vscode.CompletionItem(d.label, vscode.CompletionItemKind.Function);
            item.detail = d.detail;
            item.insertText = d.insertText;
            item.documentation = buildHoverDoc(d.label);
            return item;
          });
        }
      },
      '%', ' '
    )
  );

  // Hover — survol d'une directive
  context.subscriptions.push(
    vscode.languages.registerHoverProvider('editor-lang', {
      provideHover(document, position) {
        const name = getDirectiveAtPosition(document, position);
        if (!name) return null;
        const md = buildHoverDoc(name);
        return md ? new vscode.Hover(md) : null;
      }
    })
  );

  // Signature help — tooltip des paramètres quand on tape [% func(
  context.subscriptions.push(
    vscode.languages.registerSignatureHelpProvider(
      'editor-lang',
      {
        provideSignatureHelp(document, position) {
          const name = getDirectiveAtPosition(document, position);
          if (!name) return null;
          const doc = DIRECTIVE_DOCS[name];
          if (!doc || doc.params.length === 0) return null;

          const sig = new vscode.SignatureInformation(
            `${name}({ ${doc.params.map(p => `"${p.name}": ${p.type}`).join(', ')} })`,
            new vscode.MarkdownString(doc.description)
          );
          sig.parameters = doc.params.map(p =>
            new vscode.ParameterInformation(
              `"${p.name}": ${p.type}`,
              new vscode.MarkdownString(`${p.required ? '**Requis** — ' : ''}${p.detail}`)
            )
          );

          const help = new vscode.SignatureHelp();
          help.signatures = [sig];
          help.activeSignature = 0;
          help.activeParameter = 0;
          return help;
        }
      },
      '(', ','
    )
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
