# Changelog — Editor Lang

## 0.1.6
- Correction indentation des blocs `[% ... %]` inline dans les attributs HTML multi-lignes
- Correction détection de fermeture d'un tag multi-ligne (ex : `foo='bar'>`)

## 0.1.5
- Désactivation des validations HTML/CSS parasites sur les fichiers `.editor`

## 0.1.4
- Les directives sont toujours développées (options sur lignes séparées), y compris dans les attributs HTML

## 0.1.3
- Correction restauration des placeholders inline dans les valeurs d'attributs
- Correction détection `isInHtmlAttribute` pour les attributs multi-lignes

## 0.1.2
- Format à la sauvegarde activé automatiquement (`editor.formatOnSave`)
- Indentation par tabulations (HTML + JSON)
- Attributs multi-lignes (`<ejs-for`, etc.) : chaque attribut indenté d'un niveau, `>` au niveau du tag
- `class="..."` converti en `class='...'`

## 0.1.1
- Script `release.sh` pour versionner et packager en une commande

## 0.1.0
- Coloration syntaxique des fichiers `.editor`
- Autocomplétion des directives `[% input %]`, `[% select %]`, etc.
- Hover et signature help sur les directives
- Snippets
