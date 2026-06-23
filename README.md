# Editor Lang — VS Code Extension

Support du langage `.editor` : coloration syntaxique, formatage, autocomplétion, signature help et snippets.

---

## Fonctionnalités

### Coloration syntaxique
- Balises `[% ... %]` colorées différemment du HTML
- Mots-clés (`input`, `select`, `image`...) en évidence
- Clés JSON (`name`, `label`, `options`...) distinguées des valeurs

### Formatage (`Shift+Alt+F`)
- Indente le HTML proprement
- Formate le JSON à l'intérieur des directives sur plusieurs lignes
- **Exception :** les directives dans les attributs HTML (entre `='...'`) restent sur une seule ligne

### Autocomplétion
Tapez `[%` + espace → liste de toutes les directives disponibles avec documentation intégrée.

### Signature Help
Tapez `[% select(` → tooltip affichant les paramètres attendus avec leur type et description.

### Hover
Survolez n'importe quelle directive → documentation complète des paramètres.

### Snippets

| Préfixe | Directive |
|---|---|
| `input` | `[% input({...}) %]` |
| `textarea` | `[% textarea({...}) %]` |
| `select` | `[% select({...options multi-lignes...}) %]` |
| `select-simple` | `[% select({...options string[]...}) %]` |
| `radio` | `[% radio({...options multi-lignes...}) %]` |
| `color` | `[% color({...}) %]` |
| `texteditor` | `[% texteditor({...}) %]` |
| `file` | `[% file({...}) %]` |
| `image` | `[% image({...formats...}) %]` |
| `var` | `[% var({...}) %]` |
| `dropzone` | `[% dropzone %]` |
| `id` | `[% id %]` |
| `ejs-for` | `<ejs-for ...>...</ejs-for>` |

---

## Directives

### `[% input({...}) %]`
Champ texte modifiable.
```
"name"         string   Identifiant du champ
"label"        string   Libellé dans l'éditeur
"defaultValue" string   Valeur affichée si vide
```

### `[% textarea({...}) %]`
Zone de texte modifiable. Mêmes paramètres que `input`.

### `[% select({...}) %]`
Liste déroulante.
```
"name"         string                       Identifiant
"label"        string                       Libellé dans l'éditeur
"defaultValue" string                       Doit correspondre à une valeur des options
"options"      {label, value}[] | string[]  Options sélectionnables
```

### `[% radio({...}) %]`
Boutons radio. Mêmes paramètres que `select`.

### `[% color({...}) %]`
Sélecteur de couleur. Mêmes paramètres que `input`.

### `[% texteditor({...}) %]`
Éditeur de texte riche (HTML). Mêmes paramètres que `input`.

### `[% file({...}) %]`
Lien vers un fichier. Mêmes paramètres que `input`.

### `[% image({...}) %]`
Image responsive (génère `<picture>`).
```
"name"            string                  Identifiant
"defaultValue"    {url, size}[]           size: sm|md|lg|xl|2xl|original
"classTagPicture" string                  Classes CSS sur <picture>
"classTagImage"   string                  Classes CSS sur <img>
"formats"         {size, extension, breakpoint}[]  Formats responsive
```

### `[% var({...}) %]`
Référence à la valeur d'un autre champ.
```
"name"         string   Nom du champ à référencer
"defaultValue" string   Valeur si le champ est vide
```

### `[% dropzone %]`
Zone pour insérer des blocs enfants.

### `[% id %]`
Référence à l'identifiant unique du bloc.

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

## Règles importantes

- Dans un **attribut HTML**, toujours utiliser des **guillemets simples** autour du bloc :
  ```html
  class='[% select({...}) %]'
  ```
- Ne **pas faire de saut de ligne** dans une directive placée dans un attribut HTML.
- Le formatage respecte automatiquement cette règle.

---

## Release

Le script `scripts/release.sh` incrémente la version patch, repackage le `.vsix` et affiche le résultat.

**Première fois — rendre le script exécutable :**
```bash
chmod +x ~/.vscode/extensions/editor-lang-0.1.0/scripts/release.sh
```

**Lancer une release :**
```bash
cd ~/.vscode/extensions/editor-lang-0.1.0 && ./scripts/release.sh
```

---

## Installation

### Sur VS Code
Le plugin est déjà installé dans `~/.vscode/extensions/editor-lang-0.1.0/`.
Relancer VS Code pour l'activer.

### Sur un fork (Cursor, Windsurf...)
```bash
# Packager
cd ~/.vscode/extensions/editor-lang-0.1.0
npx @vscode/vsce package --no-dependencies

# Installer
cursor --install-extension editor-lang-0.1.0.vsix
```
Ou via l'interface : Extensions → `...` → **Install from VSIX...**
