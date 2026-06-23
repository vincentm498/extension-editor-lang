# Editor Lang

Extension VS Code pour les fichiers `.editor` — templates HTML avec directives de champs éditables.

## Fonctionnalités

| | |
|---|---|
| **Coloration syntaxique** | Balises `[% ... %]`, mots-clés, clés JSON |
| **Formatage** | `Shift+Alt+F` ou à la sauvegarde — HTML + JSON indenté automatiquement |
| **Autocomplétion** | Tapez `[%` puis espace → liste des directives avec documentation |
| **Hover** | Survolez une directive → documentation complète des paramètres |
| **Signature help** | Tapez `[% select(` → tooltip des paramètres attendus |
| **Snippets** | Préfixes courts pour insérer chaque directive |

---

## Directives

### `[% input({...}) %]`
Champ texte modifiable.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `name` | `string` | ✓ | Identifiant du champ |
| `label` | `string` | — | Libellé dans l'éditeur |
| `defaultValue` | `string` | — | Valeur affichée si vide |

### `[% textarea({...}) %]`
Zone de texte modifiable. Mêmes paramètres que `input`.

### `[% select({...}) %]`
Liste déroulante.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `name` | `string` | ✓ | Identifiant |
| `label` | `string` | — | Libellé dans l'éditeur |
| `defaultValue` | `string` | ✓ | Doit correspondre à une valeur des options |
| `options` | `{label, value}[]` ou `string[]` | ✓ | Options sélectionnables |

### `[% radio({...}) %]`
Boutons radio. Mêmes paramètres que `select`.

### `[% color({...}) %]`
Sélecteur de couleur. Mêmes paramètres que `input`. `defaultValue` accepte toute valeur CSS (`#ff0000`, `red`…).

### `[% texteditor({...}) %]`
Éditeur de texte riche (HTML). Mêmes paramètres que `input`.

### `[% file({...}) %]`
Lien vers un fichier. Mêmes paramètres que `input`.

### `[% image({...}) %]`
Image responsive — génère une balise `<picture>`.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `name` | `string` | ✓ | Identifiant |
| `defaultValue` | `{url, size}[]` | ✓ | `size` : `sm` `md` `lg` `xl` `2xl` `original` |
| `classTagPicture` | `string` | — | Classes CSS sur `<picture>` |
| `classTagImage` | `string` | — | Classes CSS sur `<img>` |
| `formats` | `{size, extension, breakpoint}[]` | — | Formats responsive (ex : `750w`) |

### `[% var({...}) %]`
Référence à la valeur d'un autre champ.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `name` | `string` | ✓ | Nom du champ à référencer |
| `defaultValue` | `string` | — | Valeur si le champ est vide |

### `[% dropzone %]`
Zone pour insérer des blocs enfants.

### `[% id %]`
Identifiant unique du bloc courant.

### `<ejs-for>`
Boucle pour répéter des éléments.

```html
<ejs-for
    name="loop"
    label="Éléments"
    max="10"
    min="1"
    buttonlabel="Ajouter"
    valuevisible="">
    <li>...</li>
</ejs-for>
```

---

## Règles de syntaxe

Dans un **attribut HTML**, toujours entourer la directive de **guillemets simples** et ne pas faire de saut de ligne :

```html
class='[% select({"name": "theme", "defaultValue": "light", "options": ["light", "dark"]}) %]'
```

Le formatage automatique respecte cette règle : les directives dans les attributs restent sur une seule ligne.

---

## Snippets

| Préfixe | Directive insérée |
|---|---|
| `input` | `[% input({...}) %]` |
| `textarea` | `[% textarea({...}) %]` |
| `select` | `[% select({...options {label,value}[]...}) %]` |
| `select-simple` | `[% select({...options string[]...}) %]` |
| `radio` | `[% radio({...}) %]` |
| `color` | `[% color({...}) %]` |
| `texteditor` | `[% texteditor({...}) %]` |
| `file` | `[% file({...}) %]` |
| `image` | `[% image({...formats...}) %]` |
| `var` | `[% var({...}) %]` |
| `dropzone` | `[% dropzone %]` |
| `id` | `[% id %]` |
| `ejs-for` | `<ejs-for ...>...</ejs-for>` |

---

## Développement

L'extension est chargée directement depuis ce dossier via un symlink dans les extensions de chaque IDE :

```
~/.vscode/extensions/innovdata.editor-lang -> /Users/innovdata/Desktop/editor-lang
~/.antigravity-ide/extensions/innovdata.editor-lang -> /Users/innovdata/Desktop/editor-lang
```

Après toute modification, recharger la fenêtre dans l'IDE concerné :
**Ctrl+Shift+P → Reload Window**

---

## Release

Le script `scripts/release.sh` incrémente la version patch, repackage le `.vsix` dans `packages/` et conserve les 5 dernières versions.

```bash
bash scripts/release.sh
```

Pour installer sur un autre IDE (Cursor, Windsurf…) via l'interface :
**Extensions → `...` → Install from VSIX…** puis sélectionner le fichier dans `packages/`.
