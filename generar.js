// Genera los datos del probador a partir del árbol extraído del mod y su localización (español e inglés).
// Uso: node generar.js <carpeta con PassiveTree.tree.json y PassiveTree.crafttree.json> <spanish.txt> <english.txt> <versión del mod>
// Inserta los datos en probador_valheiman.html (entre los marcadores /*DATA*/ ... /*END*/).
const fs = require('fs');
const path = require('path');
const [resDir, spFile, enFile, modVersion = '?'] = process.argv.slice(2);

function readLoc(file) {
  const map = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const tab = line.indexOf('\t');
    if (tab < 0) continue;
    const v = line.slice(tab + 1).replace(/\\n/g, '\n');
    if (v) map[line.slice(0, tab)] = v;
  }
  return map;
}
const slug = s => String(s).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const strip = s => String(s).replace(/<[^>]+>/g, '');
const kebab = s => String(s).replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();

// Traducciones propias: estos ids no tienen texto en ningún archivo del mod.
const PROPIAS = {
  ArmorCraftTimePct: ['tiempo de fabricación de armaduras', 'armour crafting time'],
  WeaponCraftTimePct: ['tiempo de fabricación de armas', 'weapon crafting time'],
  FoodCraftTimePct: ['tiempo de preparación de comida', 'food cooking time'],
  AttackSpeedBonuses: ['bonificaciones de velocidad de ataque', 'attack speed bonuses'],
  DistinctAmmunitionFiredRecently: ['tipos de munición distintos disparados hace poco', 'distinct ammunition types fired recently'],
  FoodEitr: ['eitr de la comida', 'eitr from food'], FoodHealth: ['salud de la comida', 'health from food'],
  FoodStamina: ['aguante de la comida', 'stamina from food'], FromItemArmour: ['armadura del equipo', 'armour from equipment'],
  FromItemRuneShield: ['escudo rúnico del equipo', 'rune shield from equipment'], GroundEffect: ['efectos de suelo', 'ground effects'],
  ItemArmourBody: ['armadura del pecho', 'chest armour'], ItemArmourHelmet: ['armadura del casco', 'helmet armour'],
  ItemRuneHelmet: ['escudo rúnico del casco', 'helmet rune shield'], LinkedAlly: ['aliado vinculado', 'linked ally'],
  MassGather: ['recolección en masa', 'mass gathering'], MaxCarryCapacity: ['peso máximo transportable', 'maximum carry capacity'],
  MaxHealth: ['salud máxima', 'maximum health'], MeadConsumed: ['al beber un hidromiel', 'on drinking a mead'],
  MissingHealthPct: ['% de salud que falta', '% missing health'], ParryResponse: ['respuesta al desvío', 'parry response'],
  RestedStacks: ['cargas de descanso', 'rested stacks'], StreakLinks: ['eslabones de racha', 'streak links'],
  TargetElementalAilments: ['dolencias elementales del objetivo', "target's elemental ailments"],
  TargetImpaleStacks: ['empalamientos en el objetivo', 'impale stacks on target'],
  VsArmourBroken: ['contra enemigos con la armadura rota', 'against enemies with broken armour'],
};
// Frases que arma el generador alrededor de los textos del mod.
const LANGS = {
  es: {
    loc: readLoc(spFile), own: 0,
    perN: (n, s) => ` por cada ${n} de ${s}`, per1: s => ` por punto de ${s}`,
    after: (n, s) => ` (tras ${n} veces ${s}`,
  },
  en: {
    loc: readLoc(enFile), own: 1,
    perN: (n, s) => ` per ${n} points of ${s}`, per1: s => ` per point of ${s}`,
    after: (n, s) => ` (after ${n} times ${s}`,
  },
};

function forLang(lang) {
  const L = LANGS[lang], loc = L.loc;
  // Traduce un id interno (sujeto, fuente, disparador...) probando las claves en que el mod lo guarda.
  function term(id, first) {
    if (id == null) return '';
    const k = kebab(id), noVs = k.replace(/^vs-/, ''), sing = k.replace(/s$/, '');
    const keys = [...first.map(p => p + id),
      '@ui.source.' + k, '@cat.' + k, '@cat.' + k + 's', '@cat.with-' + k + 's', '@cat.with-' + k,
      '@cat.against-' + noVs + '-enemies', '@cat.against-' + noVs, '@cat.on-' + k, '@cat.' + sing,
      '@wiki.' + k + '.title', '@name.' + k, '@attr.' + id + '.name', '@stat.' + id + '.gen'];
    for (const key of keys) if (loc[key]) return loc[key];
    return PROPIAS[id] ? PROPIAS[id][L.own] : id;
  }
  function modText(m) {
    let base = loc['@stat.' + m.stat + '.fmt'];
    let hasValue = true, missing = false;
    if (!base && m.text) { base = strip(m.text); hasValue = false; }
    if (!base) {
      const bare = m.stat.replace(/Pct$|Chance$/, '');
      const name = PROPIAS[m.stat] ? PROPIAS[m.stat][L.own] : term(bare, ['@attr.' + m.stat + '.name', '@ui.stats.' + kebab(m.stat)]);
      missing = name === bare;
      base = '{0} ' + (missing ? m.stat : name);
    }
    if (!base.includes('{0}') && hasValue) {
      const ab = loc['@stat.' + m.stat + '.ability'];
      if (ab && !base.startsWith(ab)) base = ab + ': ' + base;
      hasValue = false;
    }
    let t = base.replace('{0}', '{v}');
    const subj = m.subject && term(m.subject, ['@subject.']);
    if (subj && !t.includes(subj)) t += ' ' + subj;
    if (m.kind === 'per' && m.source) {
      const src = term(m.source, ['@stat.' + m.source + '.gen', '@attr.' + m.source + '.gen']);
      t += m.per > 1 ? L.perN(m.per, src) : L.per1(src);
    }
    if (m.cond) t += ', ' + term(m.cond, ['@cond.']).replace('{0}', m.threshold ?? '');
    for (const c of m.conds || [m]) {
      if (!c.after) continue;
      const trig = term(c.after, ['@trigger.']);
      t += c.threshold ? L.after(c.threshold, trig) : ` (${trig}`;
      if (c.over) t += ', ' + term(c.over, ['@subject.']);
      t += ')';
    }
    return { t, hasValue, missing };
  }
  // Como NodeNames.Title del mod: nombre en desarrollo ("own123"), nombre de atributo (FromChips), clave @name.<nombre>,
  // y recién después la clave del id. Los keystones usan solo el id; las opciones de oficios no tienen clave de id (OptKey).
  function nodeName(id, name, prefix, english, mods, keystone) {
    const byId = prefix != null && id ? loc[prefix + id] : null;
    const e = english(name || '');
    if (keystone) return byId || e;
    if (!name) return byId || e;
    if (/^own\d/.test(name)) return loc['@ui.tree.node-in-development'] || LANGS.en.loc['@ui.tree.node-in-development'] || name;
    if (mods && mods.length === 1) {
      const st = mods[0].stat, same = (a, b) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
      if (same(e, LANGS.en.loc['@attr.' + st + '.name']) || same(e, LANGS.en.loc['@attr.' + st + '.gen'])) return loc['@attr.' + st + '.name'] || e;
    }
    const k = e.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); // NodeNames.Slug: "Tracker's Eye" → tracker-s-eye
    if (k && loc['@name.' + k]) return loc['@name.' + k];
    return byId || loc[name] || loc[e] || (prefix != null && id && LANGS.en.loc[prefix + id]) || e;
  }
  return { loc, term, modText, nodeName };
}
const ES = forLang('es'), EN = forLang('en');

// Nombre de camino (Dreng, Warden...) para el nodo inicial de cada rama: se busca el @path.<id> cuyos atributos
// (@path.<id>.attr) son los mismos que los de la rama (@branch.<rama>), sin importar el orden.
const attrSet = s => String(s).toLowerCase().split(/\s+(?:and|y|e)\s+/).sort().join('|');
function pathId(branch) {
  const want = attrSet(EN.loc['@branch.' + branch] || '');
  for (const [k, v] of Object.entries(EN.loc)) {
    const m = k.match(/^@path\.([^.]+)\.attr$/);
    if (m && attrSet(v) === want) return m[1];
  }
  return null;
}
function pathName(branch, X) {
  const id = pathId(branch);
  return id && (X.loc['@path.' + id + '.name'] || EN.loc['@path.' + id + '.name']);
}

// Íconos del juego extraídos del DLL a <resDir>/iconos (ver datos_mod.md): "v2__armour.png" es el ícono "v2:armour".
// Solo se incrustan los que usa algún nodo.
const ICON_DIR = path.join(resDir, 'iconos');
const iconFiles = {};
if (fs.existsSync(ICON_DIR)) for (const f of fs.readdirSync(ICON_DIR))
  if (/.(png|jpg)$/.test(f)) iconFiles[f.slice(0, -4).replace('__', ':')] = path.join(ICON_DIR, f);
const icons = [], iconIdx = {};
function iconOf(key) {
  if (!(key in iconFiles)) return undefined;
  if (!(key in iconIdx)) {
    iconIdx[key] = icons.length;
    const mime = iconFiles[key].endsWith('.jpg') ? 'image/jpeg' : 'image/png';
    icons.push('data:' + mime + ';base64,' + fs.readFileSync(iconFiles[key]).toString('base64'));
  }
  return iconIdx[key];
}

// Reglas del panel "Bonificaciones de personajes", sacadas del código del mod con extraer_reglas.js
// (<resDir>/reglas_mod.json). Replica StatText.Tags, BonusSectionTags y RefreshAttrs del mod.
const RULES = JSON.parse(fs.readFileSync(path.join(resDir, 'reglas_mod.json'), 'utf8'));
const PCT_STATS = new Set(RULES.pctStats);

// Ícono de un nodo del árbol de oficios, como TreeWindow.CraftArt / CraftNodeArt del mod. choice = opción elegida (-1: ninguna).
// Devuelve la clave del archivo en <resDir>/iconos ("craftart:miner-node-…", "craftatlas:12", "tile:100"...).
const CI = RULES.craftIcons;
// Descripción como la muestra el juego (Wiki.Live): los "{id}" se reemplazan por el valor por defecto de la configuración del
// mod y se quitan las etiquetas <link>. Los "{0}" quedan como están, igual que en el juego.
const KNOBS = RULES.knobs || {};
const live = s => s && strip(s).replace(/\{([a-z][a-z0-9.\-]*)\}/g, (all, k) => {
  const kn = KNOBS[k];
  return !kn ? all : kn[1] ? Math.round(kn[0] * 100) + '%' : String(+kn[0].toFixed(2));
});
const CRAFT_OWN = new Set(Object.values(CI.optionArt));
const TRAVEL_SECTORS = ['forge', 'wood', 'beast', 'table', 'mead', 'road'];
const NEW_TILES = Object.fromEntries(Object.entries(CI.newIcons).filter(([g]) => g in CI.byGroup).map(([g, art]) => [CI.byGroup[g], art]));
const tileKey = i => NEW_TILES[i] ? 'art5:' + NEW_TILES[i] : 'tile:' + i;
function craftGet(key) {
  if (!key) return null;
  if (key.startsWith('art:')) return 'craftart:' + key.slice(4);
  if (CRAFT_OWN.has(key)) return 'craftmastery:' + key;
  return key in CI.tiles ? 'craftatlas:' + CI.tiles[key] : null;
}
// UiKit.Icon / IconOf para un grupo suelto ("hunt", "craft-path-forge", "craftart-runecarver-path").
function groupIcon(group) {
  if (!group) return null;
  if (group.startsWith('craftart-')) return 'craftart:' + group.slice(9);
  if (group in CI.byGroup) return tileKey(CI.byGroup[group]);
  if (group.startsWith('craft-path-') && TRAVEL_SECTORS.includes(group.slice(11))) return 'crafttravel:' + group.slice(11);
  if (group === 'cook' && 'food' in CI.byGroup) return tileKey(CI.byGroup.food);
  return craftGet(group);
}
// Ícono de un nodo de combate: el del árbol ("v2:..." o "v2m:..." para keystones y maestrías) y, si no tiene, el respaldo de
// UiKit.NodeIcon: casilla del atlas por grupo, por nombre o por el stat de alguno de sus efectos. Los engastes quedan sin ícono
// (el juego los dibuja como hueco para joya).
function haloOf(n, kind, areaProf) {
  const opts = (n.options || []).length > 0;
  if (kind === 'combat') {
    if (n.size !== 'Notable' || !opts || !n.masteryNotable) return null;
    const ic = n.icon || '';
    let theme = CI.haloAliases[ic] || (ic.startsWith('v2:') ? ic.slice(3) : null);
    if (!theme || !('halo:' + theme in iconFiles)) theme = 'health';
    return { key: 'halo:' + theme, pivot: CI.haloPivot[theme] || [0.5, 0.5] };
  }
  if (!(n.size === 'Mastery' || (n.size === 'Notable' && opts && n.masteryNotable))) return null;
  const prof = n.prof || areaProf[n.id];
  if (!prof || !CI.craftHaloPivot[prof]) return null;
  return { key: 'crafthalo:' + prof, pivot: CI.craftHaloPivot[prof] };
}
function combatIcon(n, english) {
  if (n.size === 'Socket') return null;
  // Caminos: el juego los dibuja con el ícono neutro hasta que se elige un atributo.
  if (n.size === 'Travel') return 'polish3:attribute-neutral';
  const ic = n.icon || '';
  // Si la imagen "v2:" no existe en el DLL (p. ej. v2:food), el juego sigue con el respaldo.
  if ((ic.startsWith('v2:') || ic.startsWith('v2m:')) && ic in iconFiles) return ic;
  const g = ic.startsWith('tree:') ? ic.slice(5) : ic;
  if (g && g in CI.byGroup) return tileKey(CI.byGroup[g]);
  const name = english(n.name || '');
  if (name in CI.byName) return tileKey(CI.byName[name]);
  for (const m of n.mods || []) if (m.stat in CI.byStat) return tileKey(CI.byStat[m.stat]);
  return null;
}
function craftIcon(n, sectors, choice = -1) {
  const opts = n.options || [];
  const mastery = opts.length > 0 && ['Mastery', 'Travel', 'Cross', 'Notable'].includes(n.size);
  const opt = mastery && choice >= 0 ? opts[choice] : null;
  if (n.size === 'Travel') {
    let s = n.sector;
    if ((!s || !CI.artTravel[s]) && (n.icon || '').startsWith('craft-path-')) s = n.icon.slice(11);
    const g = s && CI.artTravel[s];
    if (g) return groupIcon(g);
  }
  const art = opt && ((opt.id && CI.artOptions[opt.id]) || CI.artNames[opt.name]) || CI.artNodes[n.id];
  if (art) return 'craftart:' + art;
  if (n.size === 'Travel') {
    let s = n.sector;
    if (!TRAVEL_SECTORS.includes(s)) {
      // El más cercano por ángulo (CraftNodeArt.Travel).
      const a = Math.atan2(n.x, -n.y) * 180 / Math.PI, delta = b => Math.abs(((b - a) % 360 + 540) % 360 - 180);
      s = sectors.filter(x => TRAVEL_SECTORS.includes(x.id) && x.angle != null).sort((p, q) => delta(p.angle) - delta(q.angle))[0]?.id;
    }
    return s ? 'crafttravel:' + s : null;
  }
  if (mastery && choice < 0 && (n.prof === 'armorer' || /^(Tanner|Armorer) /.test(n.name || ''))) return craftGet('craft-mastery-armorer-tanner-s-rack');
  // CraftNodeArt.NodeKey
  let key = null;
  if (n.size !== 'Root') {
    if (opt) key = CI.optionArt[opt.name] || CI.options[opt.name] || null;
    if (!key && n.icon && (n.icon in CI.tiles || CRAFT_OWN.has(n.icon))) key = n.icon;
    if (!key && !mastery) for (const m of n.mods || []) if (CI.stats[m.stat]) { key = CI.stats[m.stat]; break; }
  }
  return craftGet(key) || (n.icon in iconFiles ? n.icon : groupIcon(n.icon));
}
const FLAGS = new Set(RULES.flags);
// Orden del panel: claves "ui.tree.body", "ui.tree.elements-ailments"... → body, elements...
const ORDER_KEY = { 'elements-ailments': 'elements' };
const SECTION_ORDER = RULES.sectionOrder.map(k => { const s = k.replace('ui.tree.', ''); return ORDER_KEY[s] || s; });
function tagSection(stat) {
  const tags = RULES.tags[stat] || [];
  for (const s of RULES.sectionTags) if (s.tags.some(t => tags.includes(t))) return s.key;
  return tags.some(t => t.startsWith('weapon-')) ? 'offence' : 'other';
}
// Como en RefreshAttrs: los efectos con condición o sujeto van a "Habilidades y reglas", salvo ResistancePct (Defensa);
// los "flag" y los de nombre corto largo (40+ letras) también van a reglas; el resto, a la sección de sus tags.
function sectionOf(m, hasValue, plain) {
  if (!hasValue) return 'rules';
  if (!plain) return m.stat === 'ResistancePct' ? 'defence' : 'rules';
  if (FLAGS.has(m.stat) || (EN.loc['@attr.' + m.stat + '.name'] || '').length >= 40) return 'rules';
  return tagSection(m.stat);
}
const sectionNames = X => Object.fromEntries([...SECTION_ORDER.map(k => [k, X.loc['@ui.tree.section.' + k] || LANGS.en.loc['@ui.tree.section.' + k] || k]),
  ['rules', X.loc['@ui.tree.skills-rules'] || 'Skills & rules']]);

function buildTree(file, kind) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const ruEn = (d.loc && d.loc.english) || {};
  const english = name => ruEn[name] || name;

  // Tabla de plantillas de efectos: cada efecto = [índice de plantilla, valor]. La clave es la estructura del
  // efecto (sin el valor), así la misma tabla sirve para los dos idiomas.
  const tpl = [], tplEn = [], snTplEn = [], tplIdx = {};
  function modTemplate(m) {
    // Pct/Chance se muestran ×100 con %, también con form "flat" (Giant's Belt: 0.025 → +2.5%, según povdb.wiki).
    // Única excepción conocida: AilmentDamagePct "flat" es un monto fijo (Eternal Pyre: +4 de daño de quemadura).
    // También los que el mod marca como porcentaje en su tabla de formato (StatText.I), como PlantWild o Conversion.
    const pct = (/(Pct|Chance)$/.test(m.stat) || PCT_STATS.has(m.stat)) && !(m.form === 'flat' && m.stat === 'AilmentDamagePct');
    // "more": factor ×(1 + valor), que se multiplica con los demás (Barbed Riposte: 1.5 → ×2.5, según povdb.wiki).
    const mo = m.more ? 1 : 0;
    const { value, ...shape } = m;
    const key = JSON.stringify(shape) + '|' + mo;
    if (!(key in tplIdx)) {
      const es = ES.modText(m), en = EN.modText(m);
      tplIdx[key] = tpl.length;
      // Efecto sin condiciones ni sujeto: en el panel de bonos se muestra como "Nombre +valor", con el nombre corto del mod.
      const plain = !m.subject && !m.cond && !m.kind && !m.after && !m.conds && !m.more;
      const entry = { t: es.t, p: pct ? 1 : 0, h: es.hasValue ? 1 : 0, mo, s: m.stat, x: es.missing ? 1 : 0, xe: en.missing ? 1 : 0,
        sec: sectionOf(m, es.hasValue, plain) };
      if (plain) entry.u = 1;
      // Conversión de defensa del equipo: armadura → escudo rúnico (ar) o al revés (ra). El juego no deja tener las dos (Masteries.Conflicts).
      const sub = m.subjects || [];
      if (m.stat === 'EquipmentDefenceConversionPct') {
        if (sub.includes('FromItemArmour') && sub.includes('ToItemRuneShield')) entry.cv = 'ar';
        else if (sub.includes('FromItemRuneShield') && sub.includes('ToItemArmour')) entry.cv = 'ra';
      }
      // Sin nombre corto en el mod: si el texto es solo "{v} Nombre" (p. ej. "+7 Armadura"), se usa ese nombre.
      const shortOf = (X, text) => X.loc['@attr.' + m.stat + '.name'] || (() => {
        const s = (text.match(/^\{v\} ([^,(]+)$/) || [])[1];
        if (!s) return null;
        const t = s.replace(/^(a|al|de|del|la|el)\s+/i, '');
        if (/\b(por|per|con|with|when|while|mientras|en|on|tras|after)\b/.test(t)) return null;
        return t.charAt(0).toUpperCase() + t.slice(1);
      })();
      const snEs = shortOf(ES, es.t), snEn = shortOf(EN, en.t);
      if (plain && es.hasValue && snEs) entry.sn = snEs;
      tpl.push(entry);
      tplEn.push(en.hasValue === es.hasValue ? en.t : es.t);
      snTplEn.push(plain && es.hasValue && snEn ? snEn : null);
    }
    return tplIdx[key];
  }
  const mods = list => (list || []).map(m => [modTemplate(m), m.value]);
  const catOf = (X, n) => n.cat ? (X.loc['@cat.' + slug(n.cat) + '.u'] || n.cat) : '';

  // Lo que el juego cambia al cargar el árbol de combate (Tree.Build): los engastes quedan vacíos (EmptySockets), y se
  // quitan los efectos ThornsPct y AutoRefuel y las opciones con AutoRefuel (FinalizeMainTree) y las líneas repetidas (DropRepeats).
  if (kind === 'combat') for (const n of d.nodes) {
    if (n.size === 'Socket') { delete n.options; n.mods = []; n.icon = null; n.defaultChoice = 0; }
    const clean = list => [...new Map((list || []).filter(m => m.stat !== 'ThornsPct' && m.stat !== 'AutoRefuel')
      .map(m => [JSON.stringify(m), m])).values()];
    n.mods = clean(n.mods);
    if (n.options) {
      const def = n.options[n.defaultChoice || 0];
      n.options = n.options.filter(o => !(o.mods || []).some(m => m.stat === 'AutoRefuel'));
      for (const o of n.options) o.mods = clean(o.mods);
      n.defaultChoice = Math.max(0, n.options.indexOf(def));
      if (!n.options.length) delete n.options;
    }
  }
  // Las opciones de oficios no se traducen por id (NodeOption.OptKey): sus ids repiten los de combate.
  const optKey = kind === 'craft' ? null : '@opt.';
  const areaProf = {};
  for (const a of Object.values(d.areas || {})) for (const id of a.nodes || []) areaProf[id] = a.prof;
  const en = { n: [], c: [], e: [], o: [], oe: [] };
  const nodes = d.nodes.map(n => {
    const o = {
      i: n.id,
      n: ES.nodeName(n.id, n.name, '@', english, n.mods, n.size === 'Keystone'),
      s: n.size,
      b: n.branch,
      // El mod usa y hacia arriba (Unity) y el canvas y hacia abajo: se invierte para que coincida con el juego
      // (Fuerza abajo a la izquierda, comparado con una captura del juego).
      x: Math.round(n.x), y: -Math.round(n.y),
    };
    en.n.push(EN.nodeName(n.id, n.name, '@', english, n.mods, n.size === 'Keystone'));
    // Los nodos iniciales del árbol de combate llevan en el juego el nombre del camino (Dreng, Warden...).
    if (kind === 'combat' && n.size === 'Starter') {
      const es = pathName(n.branch, ES), eng = pathName(n.branch, EN);
      if (es) o.n = es;
      if (eng) en.n[en.n.length - 1] = eng;
    }
    const icon = kind === 'craft' ? craftIcon(n, d.sectors || []) : n.size === 'Starter' ? 'path:' + pathId(n.branch) : combatIcon(n, english);
    const ic = iconOf(icon);
    if (ic !== undefined) o.ic = ic;
    // Halo de los notables con maestría (MasteryBacks.Make) y de las maestrías de oficios por profesión (MasteryBacks.MakeCraft).
    const halo = haloOf(n, kind, areaProf);
    if (halo) { const h = iconOf(halo.key); if (h !== undefined) { o.ha = h; if (halo.pivot[0] !== 0.5 || halo.pivot[1] !== 0.5) o.hp = halo.pivot; } }
    const cat = catOf(ES, n);
    if (cat) o.c = cat;
    en.c.push(cat ? catOf(EN, n) : null);
    if (n.extra) o.e = live(ES.loc['@' + n.id + '.desc'] || n.extra);
    en.e.push(n.extra ? live(EN.loc['@' + n.id + '.desc'] || english(n.extra)) : null);
    const m = mods(n.mods);
    if (m.length) o.m = m;
    if (n.options && n.options.length) {
      // Descripción de la opción (NodeOption.Told): por clave "opt.<id>.extra" en combate y por el texto mismo en oficios.
      const optDesc = (X, op) => op.extra ? live((optKey ? X.loc[optKey + op.id + '.extra'] : X.loc[op.extra]) || op.extra) : null;
      o.o = n.options.map(op => {
        const r = { i: op.id, n: ES.nodeName(op.id, op.name, optKey, english, op.mods), m: mods(op.mods) };
        const e = optDesc(ES, op);
        if (e) r.e = e;
        // En oficios, dos opciones son la misma si tienen el mismo nombre (CraftProgress.Effect, con LegacyName).
        if (kind === 'craft') r.k = (RULES.legacyNames || {})[op.name.trim()] || op.name.trim();
        return r;
      });
      en.oe.push(n.options.map(op => optDesc(EN, op)));
      // En el árbol de oficios, al elegir una opción el nodo muestra el dibujo de esa opción.
      if (kind === 'combat' && n.size === 'Travel') o.o.forEach((op, j) => {
        const st = (n.options[j].mods || []).map(m => m.stat), a = st.includes('AttrFinesse') ? 'dexterity' : st.includes('AttrMight') ? 'strength' : st.includes('AttrSpirit') ? 'intelligence' : null;
        const k = a && iconOf('polish3:attribute-' + a); if (k !== undefined && k !== null) op.ic = k;
      });
      if (kind === 'craft') o.o.forEach((op, j) => { const k = iconOf(craftIcon(n, d.sectors || [], j)); if (k !== undefined && k !== ic) op.ic = k; });
      o.d = n.defaultChoice || 0;
      en.o.push(n.options.map(op => EN.nodeName(op.id, op.name, optKey, english, op.mods)));
    } else { en.o.push(null); en.oe.push(null); }
    if (n.masteryId) o.mi = n.masteryId;
    const tags = [...new Set([...(n.tags || []), ...(n.topics || [])])].filter(t => !/[А-Яа-яЁё]/.test(t));
    if (tags.length) o.t = tags.join(' ');
    if (n.sector) o.sec = n.sector;
    return o;
  });
  const branches = {}, branchesEn = {};
  for (const n of d.nodes) {
    branches[n.branch] = ES.loc['@branch.' + n.branch] || n.branch;
    branchesEn[n.branch] = EN.loc['@branch.' + n.branch] || n.branch;
  }
  Object.assign(en, { tpl: tplEn, sn: snTplEn, branches: branchesEn });
  const curveKey = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
  const curves = d.links.map(([a, b]) => { const c = (d.linkCurve || {})[curveKey(a, b)]; return c ? [Math.round(c[0] * 10) / 10, -Math.round(c[1] * 10) / 10] : 0; });
  const out = { kind, revision: d.revision, generated: d.generated, refund: d.refund, nodes, links: d.links, curves, tpl, branches, en };
  // Retrato del camino de cada nodo inicial, para el centro del árbol de combate (TreePaths.Def.Face).
  if (kind === 'combat') out.portraits = Object.fromEntries(d.nodes.filter(n => n.size === 'Starter')
    .map(n => [n.id, iconOf('portrait:' + pathId(n.branch))]).filter(([, v]) => v !== undefined));
  if (kind === 'combat') out.ring = iconOf('portrait:ring');
  if (d.sectors) {
    out.sectors = d.sectors.map(s => ({ id: s.id, n: ES.loc['@name.' + slug(s.name)] || s.name, profs: s.profs }));
    en.sectors = d.sectors.map(s => EN.loc['@name.' + slug(s.name)] || s.name);
  }
  return out;
}

const SIZES = ['Root', 'Starter', 'Small', 'Travel', 'Socket', 'Portal', 'Keystone', 'Notable'];
const data = {
  version: modVersion,
  icons,
  combat: buildTree(path.join(resDir, 'PassiveTree.tree.json'), 'combat'),
  craft: buildTree(path.join(resDir, 'PassiveTree.crafttree.json'), 'craft'),
  sizes: Object.fromEntries(SIZES.map(s => [s, ES.loc['@ui.tree.kind.' + s] || s])),
  sizesEn: Object.fromEntries(SIZES.map(s => [s, EN.loc['@ui.tree.kind.' + s] || s])),
  sections: sectionNames(ES), sectionsEn: sectionNames(EN), sectionOrder: [...SECTION_ORDER, 'rules'],
  // Bonos por punto de atributo (StatText.AttrGrants): p. ej. cada punto de Fuerza da +0,125% de regeneración de salud.
  attrGrants: RULES.attrGrants.map(g => ({ ...g, p: /(Pct|Chance)$/.test(g.stat) ? 1 : 0, sec: tagSection(g.stat),
    sn: ES.loc['@attr.' + g.stat + '.name'] || g.stat, snEn: EN.loc['@attr.' + g.stat + '.name'] || g.stat })),
  // Atributos con el nombre del juego: Fuerza / Destreza / Inteligencia.
  attrs: { AttrMight: ES.loc['@attr.AttrMight.name'], AttrFinesse: ES.loc['@attr.AttrFinesse.name'], AttrSpirit: ES.loc['@attr.AttrSpirit.name'] },
  attrsEn: { AttrMight: EN.loc['@attr.AttrMight.name'], AttrFinesse: EN.loc['@attr.AttrFinesse.name'], AttrSpirit: EN.loc['@attr.AttrSpirit.name'] },
};
// Bonos por atributo sin nombre corto en el mod (p. ej. ShieldFlat): se usa el de un efecto del mismo stat.
for (const g of data.attrGrants) {
  for (const k of ['combat', 'craft']) {
    const i = data[k].tpl.findIndex(x => x.s === g.stat && x.u && x.sn);
    if (i < 0) continue;
    if (g.sn === g.stat) g.sn = data[k].tpl[i].sn;
    if (g.snEn === g.stat) g.snEn = data[k].en.sn[i] || g.snEn;
  }
}
for (const k of ['combat', 'craft']) {
  const t = data[k];
  console.log(k, 'nodos', t.nodes.length, 'enlaces', t.links.length, 'plantillas', t.tpl.length,
    'sin traducción de stat: es', t.tpl.filter(x => x.x).length, 'en', t.tpl.filter(x => x.xe).length);
}
const htmlFile = path.join(__dirname, 'probador_valheiman.html');
const html = fs.readFileSync(htmlFile, 'utf8');
const previous = JSON.parse(html.match(/\/\*DATA\*\/([\s\S]*?)\/\*END\*\//)[1]);
for (const key of ['combat', 'craft']) {
  const old = previous[key], tree = data[key];
  if (old.revision === tree.revision) {
    tree.previous = old.previous;
    continue;
  }
  const current = new Map(tree.nodes.map(n => [n.i, n]));
  const choices = {};
  for (const n of old.nodes) {
    const opts = current.get(n.i)?.o || [];
    if (!n.o || !current.has(n.i)) continue;
    const indices = n.o.map(o => opts.findIndex(p => p.i === o.i || (o.k != null && p.k === o.k)));
    if (indices.some((index, i) => index !== i)) choices[n.i] = indices;
  }
  tree.previous = { revision: old.revision, choices };
}
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const next = html.replace(/\/\*DATA\*\/[\s\S]*?\/\*END\*\//, () => '/*DATA*/' + json + '/*END*/');
fs.writeFileSync(htmlFile, next);
console.log('HTML actualizado:', htmlFile, Math.round(next.length / 1024) + ' KB');
// Lista de lo que falta traducir, para pendientes.md
const missing = { es: new Set(), en: new Set() }, rawIds = { es: new Set(), en: new Set() };
for (const k of ['combat', 'craft']) {
  const t = data[k];
  t.tpl.forEach((x, i) => {
    if (x.x) missing.es.add(x.s);
    if (x.xe) missing.en.add(x.s);
    for (const [lang, text] of [['es', x.t], ['en', t.en.tpl[i]]])
      for (const m of text.matchAll(/\b[A-Z][a-z]+(?:[A-Z][a-z]*)+\b/g)) rawIds[lang].add(m[0]);
  });
}
const report = [];
for (const lang of ['es', 'en']) report.push(`# Stats sin texto (${lang})`, ...[...missing[lang]].sort(), '',
  `# Ids internos que siguen apareciendo en los textos (${lang})`, ...[...rawIds[lang]].sort(), '');
fs.writeFileSync(path.join(__dirname, 'stats_sin_traduccion.txt'), report.join('\n'));
console.log('ids crudos restantes: es', rawIds.es.size, 'en', rawIds.en.size);
