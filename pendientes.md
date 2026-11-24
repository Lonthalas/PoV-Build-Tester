# Pendientes y dudas sobre las reglas

Lo que el probador supone y todavía no se comprobó en el juego. Si algo no coincide, anotarlo acá.

## Reglas de validación (supuestas)

| Regla en el probador | Fuente | Estado |
|---|---|---|
| Cada nodo cuesta 1 punto | Probado en el juego (2026-10-25); código: `Progress.SpentPoints` | Confirmado |
| Solo los **notables** con opciones cobran la opción: elegirla es opcional y cuesta 1 punto más | Código: `Progress.TwoStep`, `OptionPoints` (2026-10-27) | Confirmado |
| En los demás nodos con opciones (los Caminos que dan a elegir Destreza/Fuerza/Intelecto) la opción viene incluida; sin elegir, el juego usa la opción por defecto | Código: `Progress.Allocate`, `Masteries.Selected` | Confirmado |
| Los **engastes** (Socket) no dan nada: el juego les borra opciones y efectos al cargar el árbol (`Tree.EmptySockets`). Los "Cruce de atributos" no dan atributos hasta que se les pone una joya | Código. Visto en el juego (2026-10-27): es un engaste sin bonificación; solo da algo con una joya puesta, y la joya se cambia o se saca sin costo ni puntos | Confirmado. Corregido en el probador (antes los cobraba +1 y sumaba sus atributos) |
| El centro y los **nodos iniciales** de cada camino no cuestan puntos: el nodo inicial se abre al asignar un vecino | Código: `SpentPoints = Allocated − 1`, `FreeGates`; en oficios `CraftProgress.Take`. Visto en el juego (2026-10-27): el primer nodo solo sirve para elegir el camino y no tiene efecto | Confirmado. Corregido (antes cobraba 1 por cada nodo inicial) |
| En el árbol de combate **solo se puede abrir un camino** (`GateLimit = 1`); el árbol se recorre sin pasar por los otros nodos iniciales. En oficios se pueden abrir los seis | Código: `Progress.GateLimit`, `Passable`, `GateBlocked`. Visto en el juego (2026-10-27): el camino inicial es único (la clase elegida); después se puede llegar a nodos de otras ramas por los enlaces comunes | Confirmado. Ahora es un error de validación. La excepción es la joya "Mountain heart", que no se simula |
| Los portales están conectados entre sí | Código: `Tree.Around` | Confirmado |
| Puntos de combate = (nivel − 1) × puntos por nivel + extras | Probado en el juego; código: `TotalPoints`, `PointsForLevels` (redondea hacia abajo) | Confirmado |
| Un nodo tiene que estar conectado al inicio por nodos asignados | Campo `refund: disconnected-from-start` del árbol | Confirmado por datos |
| Al quitar un nodo se quitan los que quedan desconectados | Probado en el juego | Confirmado |
| Maestría repetida: no se puede elegir una opción con **los mismos efectos y valores** que la de otro nodo asignado, aunque sea de otro grupo. Los Caminos no cuentan, y la opción de +atributos de la maestría de comodidad se puede repetir | Probado en el juego (lo bloquea); código: `Masteries.Selected`, `CraftProgress.UsedElsewhere` | Confirmado. Antes el probador solo comparaba dentro del mismo grupo. También se valida (desde el 2026-10-27) que no se tengan a la vez las conversiones opuestas armadura → escudo rúnico ("Placas y runas", 4 notables) y escudo rúnico → armadura (2 notables), como `Masteries.Conflicts` |
| Puntos de oficio: los carga el usuario (por defecto 250) | `.cfg`: 250 por niveles + 150 por tareas + 10 de Eureka por profesión + piedras rúnicas | El total real depende del progreso de cada partida |
| No hay máximo de keystones ni por categoría | No aparece en el código, ni en povdb.wiki, ni en el Discord | Confirmado por código |
| Efectos que el juego quita al cargar: ThornsPct y AutoRefuel, y las opciones que dan AutoRefuel (`Masteries.FinalizeMainTree`); líneas repetidas (`Tree.DropRepeats`) | Código | Aplicado en el probador |
| Valores del servidor: el mod puede bajar del sitio del autor ajustes de balance (`TreeValues`) y árboles nuevos (`TreeRemote`) | Código | En esta instalación no hay ninguno guardado (la carpeta `config` no tiene `treextr.pathofvalheiman.tree.json`), así que vale el árbol incluido en el DLL |
| Escala de los porcentajes: todos los Pct/Chance ×100, también los "flat" (Giant's Belt: +2.5%) | povdb.wiki, que genera sus textos con el código del juego (2026-10-26) | Confirmado. Única excepción: Eternal Pyre ("+4 de daño de quemadura", monto fijo) |

## Panel "Bonificaciones del personaje" (agregado el 2026-10-27)

- **Secciones**: ahora siguen el código del mod (`RefreshAttrs` / `BonusSection`): Cuerpo, Ofensiva, Elementos y dolencias, Defensa, Movimiento, Artesanía, Recolección, Otros, y "Habilidades y reglas" para los efectos condicionales, las habilidades y los stats "flag". Confirmado.
- **Atributos**: ahora se suma lo que da cada punto (`StatText.AttrGrants`). Comparado con la captura del juego (Fuerza 35, Destreza 10): "Llevar peso +7" y "Índice de evasión +1,5%" coinciden. **Pendiente**: de dónde sale el "Salud máxima +20" de la captura; no viene de los atributos.
- **Sin modelar**: el panel del juego también muestra la velocidad de disparo del arma equipada y los bonos del equipo; el probador no simula equipo.
- El panel suma **los dos árboles**, como el del juego.

## Nodos ocultos (2026-10-29)

- Como el juego con la opción `Show empty nodes` apagada (`TreeWindow.HiddenEmpty`), el árbol de combate oculta los nodos chicos, notables y keystones sin efectos ni opciones (813 nodos, casi todos "En desarrollo"), con sus enlaces. No aparecen en el mapa ni en el Catálogo, y el camino automático no pasa por ellos. Si un build importado tiene alguno asignado, se muestra. Los Caminos, engastes, portales y nodos iniciales siempre se ven. El árbol de oficios no oculta nada, igual que el juego.

## Mapa como el del juego (2026-10-29)

Comparado con un video del árbol en el juego. Todo sale del código del mod:
- **Enlaces curvos**: Bézier cuadrática con el punto de control en el medio del enlace más el desplazamiento `linkCurve` del árbol (`Tree.PathOf`).
- **Buscador sobre el mapa** con contador ("Encontrados: N"): los nodos que no coinciden se oscurecen. Busca en nombres y efectos del idioma elegido ("fantasma" da 33, como "phantom" en el juego).
- **Controles**: clic izquierdo asigna, clic derecho quita, Inicio muestra todo el árbol, + / − hacen zoom. En pantallas táctiles un toque sigue asignando o quitando.
- **Caminos alternativos** (propio del probador, no está en el juego): con el puntero sobre un nodo sin asignar, la rueda del mouse recorre hasta 10 caminos para llegar a él, hasta 2 puntos más que el más corto. Empieza por el más corto y la rueda hacia arriba avanza por rama: en cada bifurcación sigue el sentido antihorario en pantalla, así los caminos que comparten tramo quedan juntos (en Raven's Eye: Draw speed → Damage → Path por Ullr's Draw, y después los de Fox's Stride). El globo dice "Camino 2 de 9" y el clic asigna el camino que se ve. Si el nodo tiene un solo camino, o el puntero no está sobre un nodo, la rueda hace zoom; Ctrl + rueda hace zoom siempre.
- **Caminos**: ícono neutro hasta que se asignan; después, el del atributo elegido (`UiKit.AttributeIcon`).
- **Retrato del camino** en el centro del árbol de combate, dentro del marco del juego (`TreePaths.Def.Face`, `portrait-ring`). El nodo central no se dibuja, como en el juego. Sin camino abierto solo se ve el marco.
- **Halos** detrás de los notables con maestría (`MasteryBacks`) y de las maestrías de oficios por profesión (`CraftHalos`). Sin asignar se ven apagados. Aproximación: los notables de combate sin ícono "v2" usan el halo genérico, y el apagado es un filtro, no la versión gris exacta del juego.

## Guardar y cargar builds (2026-11-02)

- Pestaña **Builds** (antes "Exportar"). En **Mis builds** se guarda el build con nombre en el navegador: los dos árboles, el nivel, los puntos por nivel, los puntos extra y los de oficio (clave `pov-builder-saves` de localStorage). Cada guardado se puede cargar, bajar como archivo o borrar. Guardar con un nombre que ya existe pide confirmación antes de reemplazarlo. Cargar se puede deshacer.
- **Archivo**: "Guardar en archivo" descarga un `.json` (formato `pov-builder` versión 2, con `combat` y `craft`); "Abrir archivo" lo carga. Importar por texto acepta los dos formatos: el viejo de un solo árbol (versión 1, como `build_tanque.json`) deja el otro árbol como estaba.
- Los builds guardados en el navegador solo existen en ese navegador y en esa computadora: para pasarlos a otro lado hay que usar el archivo.

## Lo que no se modela

- **Áreas con niebla del árbol de oficios** (`chunks` / `areas`): en el juego algunas zonas se revelan al cumplir tareas ("Rompe 25 bloques de cobre…"). El probador deja asignar cualquier nodo.
- **Joyas** en los engastes (Socket): no se simulan.
- **Portales / subclases** (`SubclassReveal`): se tratan como nodos comunes, conectados entre sí.
- **Condiciones y topes**: el "Resumen de efectos" suma los efectos condicionales ("en movimiento", "tras bloquear") como si siempre estuvieran activos, y no aplica topes.

- **Límite de puntos de combate en 6.0.15**. El nivel va de 1 a 200 (199 puntos con 1 por nivel). Los puntos extra van de 0 a 116 con la configuración por defecto (`Progress.ContentCap`): 11 jefes × 4, 12 monolitos × 3 y 36 mazmorras × 1. Con todo, el máximo es 315. Los valores fuera de rango se corrigen al escribirlos, al cargar un build y al abrir la página. Los puntos por nivel siguen libres (0,01 a 10) porque son configuración del servidor. Los puntos de oficio van de 0 a 490 (`CraftProgress.MaxTotalPoints`): 250 de niveles de oficio, 80 de piedras rúnicas leídas (1 c/u) y 160 de Eureka (10 por profesión × 16 profesiones; quedan excluidas las reservadas `runecarver` y `road3`).

## Textos

- **Formato de porcentajes**: los stats `…Pct` / `…Chance` se muestran ×100 con `%` (0.15 → +15%), con cualquier `form`. Comparado con povdb.wiki en Giant's Belt, Traveller's Megingjord, Ironblood y Eternal Pyre. Desde el 2026-10-27 también los que la tabla de formato del mod (`StatText.I`) marca como porcentaje aunque el nombre no termine en Pct: PlantWild (+8%), RestedFishPerStack (+1%), DamageOverTimeMultiplier (+2%), Conversion y GainAsExtra. Antes se mostraban como "+0,08".
- **Nombres**: desde el 2026-10-27 se traducen como `NodeNames.Title` del mod: primero el nombre del nodo (`@name.<nombre>`), después el id. Antes era al revés, y unos 1.100 nodos de combate mostraban una traducción vieja de su id (por ejemplo `g0_x1`, que da daño de hechizo y eitr, salía "Reserva de eitr" en vez de "Enfoque rúnico"). Las opciones del árbol de oficios ya no se traducen por id: sus ids repiten los de combate y salían nombres de combate ("Sangre en movimiento" en vez de "Belt Lantern"). Los nodos llamados `ownNNN` se muestran "En desarrollo", como en el juego.
- **Fórmula oficial de stats** (FAQ del Discord): `Final = (Base + planos) × (1 + suma de %) × cada ×N`. El "Resumen de efectos" la aplica: los % se suman y los efectos multiplicativos se muestran como ×N y se multiplican entre sí (dos ×0.9 dan ×0.81). El factor es ×(1 + valor), comparado con povdb.wiki en Gathered Rumble (×0.9), Barbed Riposte (×2.5), Share the Pace (×0.5) y Blood in Motion (×1.5).
- **Nombres sin traducción** (anterior al cambio de nombres de arriba): unos 760 nodos de combate y 88 de oficios no tienen nombre (se mostraban como `ownNNNN` o vacíos). La mayoría son nodos de camino sin efecto, pero hay algunos con efecto, como el keystone `own9390`. Algunos nombres solo están en inglés porque al `spanish.txt` del mod le faltan (por ejemplo "On Burning Coals", "Wanderer's Footing").
- **Ids internos en los textos**: ya no queda ninguno. La mayoría se resolvió con claves del propio mod (`@ui.source.*`, `@cat.against-*`, `@wiki.*.title`…). Para 26 ids que el mod no traduce en ningún archivo (por ejemplo `MaxCarryCapacity`, `RestedStacks`, `ArmorCraftTimePct`), `generar.js` usa traducciones propias (diccionario `PROPIAS`). **Pendiente**: comparar esos textos con el juego. `stats_sin_traduccion.txt` lista lo que vuelva a faltar después de una actualización del mod.
- **Descripciones de las opciones**: desde el 2026-11-02 cada opción muestra su descripción (`NodeOption.Told`), que antes se perdía. Son 88 en combate y 1612 en oficios. Las de combate se traducen con `@opt.<id>.extra`. Las de oficios se buscan por el texto mismo, pero el `spanish.txt` del mod solo traduce 10, así que el resto se ve en inglés, igual que en el juego. Los `{...}` se reemplazan por el valor por defecto de la configuración del mod (`Tunables`, que copia `extraer_reglas.js`). Si el servidor cambia la configuración, el valor del juego puede ser otro. Los `{0}` quedan como están (por ejemplo en "Broad Sowing").
- **Opciones ya tomadas**: desde el 2026-11-02 una opción que ya está elegida en otro nodo asignado se ve deshabilitada, con el aviso "Ya obtenida en <nodo>", como en el juego. En combate cuentan como iguales las opciones con los mismos efectos y valores (`Masteries.Selected`), y también se bloquea la conversión opuesta (armadura ↔ escudo rúnico). En oficios cuentan como iguales las de mismo nombre (`CraftProgress.UsedElsewhere`), con los nombres viejos que el mod unifica (`LegacyNames`, por ejemplo "Nearby Chests (cooking)" = "(supplies)"). Antes la validación de oficios comparaba efectos, y como esas opciones no tienen stats, dos opciones distintas sin stats contaban como repetidas. Un build importado con una opción repetida sigue marcándose como error.
- **Atributo de los Caminos y cambio de opción**: desde el 2026-11-02 los Caminos que se asignan toman el último atributo que eligió el jugador (como `SessionTravelChoice`, que reconoce la opción por su atributo aunque el orden cambie). Shift + clic sobre un nodo asignado pasa a la siguiente opción libre sin quitar el nodo (`MarkSwitchNext`), y también se puede cambiar desde el panel. En el juego, cambiar la opción de un nodo ya tomado cuesta lo mismo que reembolsarlo (`SwitchCost`: el costo del nodo, o 1 punto en los notables con opción). El probador no lo cobra, igual que no cobra los reembolsos.
- **Valores muy chicos**: algunos porcentajes salen como "+0.03% … por cada 100 de peso máximo transportable". Conviene comparar con el tooltip del juego para confirmar la escala.

## Verificación hecha (fuera del juego)

Probado en el navegador el 2026-10-25: búsqueda, asignar con camino automático, quitar con dependientes, build inválido (nivel 5 con 22 puntos usados → error "faltan 17, necesitás nivel 22"), importar con un id inexistente y un nodo desconectado (los dos marcados como error), exportar e importar sin pérdidas, cambio al árbol de oficios, persistencia al recargar y vista en celular (375 px). **Falta comparar con el juego.**
