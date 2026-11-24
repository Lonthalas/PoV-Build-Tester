// Extrae del código decompilado del mod (Path of Valheiman, de treextr) las reglas del panel
// "Bonificaciones de personajes": tags de cada stat, stats de tipo "flag", secciones y bonos por punto de atributo.
// La licencia del mod permite leer el código y reusar partes con crédito (ver datos_mod.md).
// Uso: node extraer_reglas.js <PathOfValheiman.decompiled.cs> <carpeta de salida>  → escribe reglas_mod.json
const fs = require('fs');
const path = require('path');
const [csFile, outDir] = process.argv.slice(2);
const src = fs.readFileSync(csFile, 'utf8');

// Devuelve el bloque { ... }; que sigue a la declaración indicada (buscándola a partir de `from`: hay otra tabla
// "T" en otra clase, la del panel es la de StatText).
function block(decl, from = 0) {
  const i = src.indexOf(decl, from);
  if (i < 0) throw new Error('No se encontró: ' + decl);
  const start = src.indexOf('{', i);
  let depth = 0;
  for (let j = start; j < src.length; j++) {
    if (src[j] === '"') { j++; while (j < src.length && src[j] !== '"') { if (src[j] === '\\') j++; j++; } continue; }
    if (src[j] === '{') depth++;
    else if (src[j] === '}' && --depth === 0) return src.slice(start, j + 1);
  }
  throw new Error('Bloque sin cerrar: ' + decl);
}
const strings = s => [...s.matchAll(/"([^"]*)"/g)].map(m => m[1]);

// Tags por stat: { Stat.X, new string[n] { "a", "b" } }
const tags = {};
const statText = src.indexOf('public static class StatText');
for (const m of block('Dictionary<Stat, string[]> T = new', statText).matchAll(/Stat\.(\w+),\s*new string\[\d+\]\s*\{([^}]*)\}/g))
  tags[m[1]] = strings(m[2]);

// Stats de tipo flag en la tabla de formato: { Stat.X, Flag("...") }
const flags = [...block('Dictionary<Stat, Info> I = new', statText).matchAll(/Stat\.(\w+),\s*Flag\(/g)].map(m => m[1]);

// Secciones por tag, en el orden en que el juego las prueba.
const sectionTags = [...block('BonusSectionTags = new').matchAll(/\("(\w+)", "([^"]+)", new string\[\d+\]\s*\{([^}]*)\}\)/g)]
  .map(m => ({ key: m[1], name: m[2], tags: strings(m[3]) }));

// Orden de las secciones en el panel: L.Id("ui.tree.body", "Body") ...
const sectionOrder = [...block('BonusSectionOrder => new').matchAll(/L\.Id\("([^"]+)"/g)].map(m => m[1]);

// Bonos por punto de atributo: (Stat.AttrMight, Stat.HealthRegenPct, 0.00125f)
const attrGrants = [...block('AttrGrants = new', statText).matchAll(/\(Stat\.(\w+), Stat\.(\w+), ([\d.]+)f\)/g)]
  .map(m => ({ attr: m[1], stat: m[2], per: parseFloat(m[3]) }));

// Stats que el juego muestra como porcentaje (×100 y %): en la tabla de formato son P("...") o M("...", "...").
const pctStats = [...block('Dictionary<Stat, Info> I = new', statText).matchAll(/Stat\.(\w+),\s*(?:P|M)\(/g)].map(m => m[1]);

// Íconos del árbol de oficios (CraftNodeArt e IconRegistry): tablas "clave" → imagen o número de casilla del atlas.
const pairs = s => Object.fromEntries([...s.matchAll(/\{\s*"([^"]*)",\s*(?:"([^"]*)"|(-?\d+))\s*\}/g)]
  .map(m => [m[1], m[2] !== undefined ? m[2] : +m[3]]));
const craftArt = src.indexOf('public static class CraftNodeArt');
const registry = src.indexOf('public static class IconRegistry');
const iconMap = src.indexOf('public static class IconMap');
const craftIcons = {
  stats: pairs(block('Dictionary<string, string> Stats = new', craftArt)),
  options: pairs(block('Dictionary<string, string> Options = new', craftArt)),
  tiles: pairs(block('Dictionary<string, int> Tiles = new', craftArt)),
  artNodes: pairs(block('Dictionary<string, string> CraftArtNodes = new', registry)),
  artOptions: pairs(block('Dictionary<string, string> CraftArtOptions = new', registry)),
  artNames: pairs(block('Dictionary<string, string> CraftArtNames = new', registry)),
  artTravel: pairs(block('Dictionary<string, string> CraftArtTravel = new', registry)),
  optionArt: pairs(block('Dictionary<string, string> CraftOptionArt = new', registry)),
  // Grupo → casilla del atlas general de íconos (PassiveTree.icons.png, 16 columnas de 128 px).
  byGroup: pairs(block('Dictionary<string, int> ByGroup = new', iconMap)),
  // Respaldo de UiKit.NodeIcon para los nodos de combate sin ícono propio: por nombre y por stat.
  byName: pairs(block('Dictionary<string, int> ByName = new', iconMap)),
  byStat: Object.fromEntries([...block('Dictionary<Stat, int> ByStat = new', iconMap).matchAll(/Stat\.(\w+),\s*(\d+)/g)].map(m => [m[1], +m[2]])),
  // Punto de apoyo de cada halo de maestría (HaloCenters.Pivot), y de los halos de oficios por profesión (CraftHalos.Of).
  haloPivot: Object.fromEntries([...block('> Pivot = new', src.indexOf('public static class HaloCenters'))
    .matchAll(/"([^"]+)",\s*new (?:UnityEngine\.)?Vector2\(([\d.]+)f, ([\d.]+)f\)/g)].map(m => [m[1], [+m[2], +m[3]]])),
  haloAliases: pairs(block('Dictionary<string, string> ByIcon = new', src.indexOf('public static class HaloAliases'))),
  craftHaloPivot: Object.fromEntries([...block('Of = new', src.indexOf('public static class CraftHalos'))
    .matchAll(/"([^"]+)",\s*\(new (?:UnityEngine\.)?Vector2\(([\d.]+)f, ([\d.]+)f\)/g)].map(m => [m[1], [+m[2], +m[3]]])),
  // Casillas reemplazadas por un dibujo nuevo (UiKit.NewIconName): ("block", "shield") → art5.icon-shield.
  newIcons: Object.fromEntries([...block('private static string NewIconName').matchAll(/\("(\w+)", "(\w+)"\)/g)].map(m => [m[1], m[2]])),
};

// Valores por defecto de los "{...}" en las descripciones (Wiki.Live): Tunables.Knob(id, stat, título, valor, pct) y el
// peaje de los portales, que sale de la opción "Ore portal toll" de la configuración.
const knobs = Object.fromEntries([...src.matchAll(/new Knob\("([^"]+)", Stat\.\w+, "[^"]*", (-?[\d.]+)f?, pct: (true|false)/g)]
  .map(m => [m[1], [+m[2], m[3] === 'true' ? 1 : 0]]));
const toll = src.match(/"Ore portal toll", ([\d.]+)f/);
if (toll) knobs['portal.toll'] = [+toll[1], 1];

// Nombres viejos de opciones de oficios que el mod trata como la opción nueva (CraftMasteries.LegacyNames).
const legacyNames = pairs(block('Dictionary<string, string> LegacyNames = new'));

const out = { tags, flags, sectionTags, sectionOrder, attrGrants, pctStats, craftIcons, knobs, legacyNames };
fs.writeFileSync(path.join(outDir, 'reglas_mod.json'), JSON.stringify(out));
console.log('tags:', Object.keys(tags).length, '| flags:', flags.length, '| secciones:', sectionTags.map(s => s.key).join(', '),
  '| orden:', sectionOrder.length, '| bonos por atributo:', attrGrants.length, '| stats en %:', pctStats.length,
  '| íconos de oficios:', Object.entries(craftIcons).map(([k, v]) => k + ' ' + Object.keys(v).length).join(', '));
