# Fuentes de datos: Path of Valheiman

Versión del mod: **6.0.15** (treextr-PathOfValheiman, datos extraídos el 2026-11-23 del perfil de r2modman).

La actualización desde 5.3.6 incorpora las revisiones de combate del 19 de noviembre y de oficios del 16 de noviembre de 2026. El probador migra los índices de opciones guardados en la revisión anterior y avisa en Validación cuando una opción fue retirada.

## Dónde está instalado el mod

No está en la carpeta del juego (`D:\SteamLibrary\steamapps\common\Valheim\BepInEx\plugins` está vacía). Está en el perfil de r2modman:

```
%APPDATA%\r2modmanPlus-local\Valheim\profiles\PathOfTheValhemian\BepInEx\
  plugins\treextr-PathOfValheiman\PathOfValheiman\PathOfValheiman.dll   (192 MB)
  plugins\treextr-PathOfValheiman\PathOfValheiman\Localization\*.txt
  config\treextr.pathofvalheiman.cfg
```

## Fuentes usadas

| Fuente | Qué aporta | Cómo se obtuvo |
|---|---|---|
| `PassiveTree.tree.json.gz` (recurso dentro del DLL) | Árbol de combate: 4.138 nodos, 4.699 conexiones, posiciones, tipo (Small/Notable/Keystone…), rama, categoría, efectos (`mods`), opciones elegibles y grupos de maestría | Lectura del recurso embebido |
| `PassiveTree.crafttree.json.gz` (recurso dentro del DLL) | Árbol de oficios: 1.047 nodos, 1.205 conexiones, 6 sectores | Ídem |
| `Localization/spanish.txt` | Nombres de nodos (`@<id>`, `@opt.<id>`, frase rusa original), textos de efectos (`@stat.X.fmt`), condiciones (`@cond.*`), sujetos (`@subject.*`), disparadores (`@trigger.*`), ramas y categorías | Archivo de texto del mod |
| `Localization/english.txt` | Todos los textos de la versión en inglés del probador (selector ES / EN), y respaldo cuando falta la traducción española | Archivo de texto del mod |
| `treextr.pathofvalheiman.cfg` y reglas del DLL | Nivel máximo 200, 1 punto por nivel y hasta 116 extra (11 jefes × 4, 12 monolitos × 3 y 36 mazmorras × 1). Oficios: hasta 490 puntos (250 por niveles, 80 por piedras rúnicas y 160 por Eureka). Las tareas desbloquean áreas. | Configuración y código del mod |
| Campo `refund` del árbol | El juego reembolsa los nodos que quedan desconectados del inicio o cambian de categoría | Del JSON del árbol |

Revisión del árbol de combate: `generated 2026-11-19T17:42:20+00:00`.

## Cómo se regeneran los datos (después de actualizar el mod)

1. Extraer los recursos del DLL (solo lectura) desde Windows PowerShell 5.1:

   ```powershell
   $dll = "$env:APPDATA\r2modmanPlus-local\Valheim\profiles\PathOfTheValhemian\BepInEx\plugins\treextr-PathOfValheiman\PathOfValheiman\PathOfValheiman.dll"
   $out = "D:\PoV Builder\res"; New-Item -ItemType Directory -Force $out | Out-Null
   $asm = [Reflection.Assembly]::ReflectionOnlyLoad([IO.File]::ReadAllBytes($dll))
   foreach ($n in 'PassiveTree.tree.json.gz','PassiveTree.crafttree.json.gz') {
     $g = New-Object IO.Compression.GZipStream($asm.GetManifestResourceStream($n), [IO.Compression.CompressionMode]::Decompress)
     $j = [IO.File]::Create("$out\" + $n.Replace('.gz','')); $g.CopyTo($j); $j.Close(); $g.Close()
   }
   ```

   Después, los íconos de los nodos (también recursos del DLL), reducidos a 48 px, en la carpeta `iconos`:

   ```powershell
   Add-Type -AssemblyName System.Drawing
   New-Item -ItemType Directory -Force "$out\iconos" | Out-Null
   foreach ($res in $asm.GetManifestResourceNames()) {
     if ($res -match '^PassiveTree\.v2\.icon\.(.+)\.png$') { $key = "v2__" + $Matches[1] }
     elseif ($res -match '^PassiveTree\.path\.(.+)-normal\.png$') { $key = "path__" + $Matches[1] }
     else { continue }
     $img = [Drawing.Image]::FromStream($asm.GetManifestResourceStream($res))
     $bmp = New-Object Drawing.Bitmap 48, 48; $g = [Drawing.Graphics]::FromImage($bmp)
     $g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
     $g.DrawImage($img, 0, 0, 48, 48); $g.Dispose()
     $bmp.Save("$out\iconos\$key.png", [Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose(); $img.Dispose()
   }
   ```

   El mismo script extrae también los halos de maestría (`v2.halo.*`, `v2.crafthalo.*`, a 80 px), los íconos de los Caminos (`polish3.attribute-*`) y los retratos de cada camino con su marco (`path-*-512`, en JPEG de 384 px; `polish3.portrait-ring`).

   Los íconos del **árbol de oficios** se extraen con `iconos_oficios.ps1` (está en esta carpeta; hace lo mismo que el bloque de arriba para `PassiveTree.craftart.*`, `craftmastery.*`, `crafttravel.*` y `art5.icon-*`, y recorta las casillas de los dos atlas: `craftnodes.atlas.png`, 13 columnas de 256 px cada 260 px, y `icons.png`, 16 columnas de 128 px):

   ```powershell
   & "D:\PoV Builder\iconos_oficios.ps1" -dll $dll -out "$out\iconos"
   ```

   Qué ícono le toca a cada nodo de oficios lo decide el código del mod (`TreeWindow.CraftArt`, `CraftNodeArt`, `IconRegistry`): `extraer_reglas.js` copia esas tablas a `reglas_mod.json` y `generar.js` repite la misma lógica. Con una opción de maestría elegida, el nodo muestra el dibujo de la opción, como en el juego.

   El generador solo incrusta en la página los íconos que usa algún nodo. En el árbol de combate, los keystones y maestrías usan `PassiveTree.v2.mastery.*` (clave `v2m:` en el árbol; los extrae el mismo script), y los nodos sin ícono propio usan el respaldo de `UiKit.NodeIcon`: casilla del atlas por grupo, nombre o stat (`IconMap`). Comparado el 2026-10-29 con el visor de árbol de povdb.wiki: todos los nodos que muestra ese visor tienen ícono en el probador, salvo los engastes, que el juego dibuja como hueco para joya. Los ~860 nodos que siguen sin ícono son nodos vacíos o "En desarrollo" que el juego oculta (opción `Show empty nodes`, apagada por defecto).

2. Ejecutar el generador (necesita Node.js), que reemplaza los datos dentro del HTML:

   ```
   node "D:\PoV Builder\generar.js" "D:\PoV Builder\res" "<carpeta Localization>\spanish.txt" "<carpeta Localization>\english.txt" 6.0.15
   ```

   El último dato es la versión del mod, que se muestra en la pestaña Exportar. Está en la primera línea de `BepInEx\config\treextr.pathofvalheiman.cfg` y abajo a la izquierda del árbol en el juego. El generador también invierte el eje vertical para que el árbol se vea orientado como en el juego.

   Genera los textos en español y en inglés a la vez, y reescribe `stats_sin_traduccion.txt` con lo que falte traducir en cada idioma. Los textos de la interfaz (botones, mensajes) están en el diccionario `STR` dentro del HTML.

## Fuentes no usadas o que faltan

- **Ascendencias** (`PassiveTree.classes.json.gz`): corresponden a un árbol independiente de los dos que planifica el probador.
- **Código del DLL**: ver la sección "Código del mod" más abajo. Los topes y las condiciones de los efectos siguen sin modelarse; ver `pendientes.md`.
- **Joyas** (`PassiveTree.jewel.*`): solo están los íconos, no se modelan.
- **Catálogo de botín** (`PassiveTree.loot.catalog.json`): no se usó.
- **`tree-prev.json`**: versión anterior del árbol, ignorada.
## Código del mod (2026-11-23)

La licencia del mod (`LICENSE.md`, punto 3) permite leer el código y reusar partes "provided the origin is credited". **Crédito**: las reglas del panel "Bonificaciones del personaje" del probador salen del código de **Path of Valheiman, de treextr** (https://thunderstore.io/c/valheim/p/treextr/PathOfValheiman/), versión 6.0.15.

- **Decompilado** con ilspycmd 11.1.0.9782 (nuget.org) sobre el runtime portátil de .NET 10.0.13 (Microsoft), los dos verificados con su hash oficial y usados desde el scratchpad, sin instalar nada y sin modificar el DLL.
- **`extraer_reglas.js`** lee el código decompilado y escribe `reglas_mod.json` con:
  - los tags de cada stat (`StatText.T`, 751 stats);
  - los stats "flag" (455, las habilidades);
  - las secciones y su orden (`BonusSectionTags`, `BonusSectionOrder`);
  - lo que da cada punto de atributo (`StatText.AttrGrants`);
  - los stats que se muestran como porcentaje (`StatText.I`);
  - las tablas de íconos del árbol de oficios (`CraftNodeArt`, `IconRegistry`, `IconMap.ByGroup`).
- **Revisión de fidelidad (2026-10-27)**: se compararon con el código las reglas de puntos, opciones, nodos iniciales, engastes, maestrías repetidas, portales, formato de porcentajes y nombres. Lo que cambió en el probador está en `pendientes.md`.
- **Por punto de atributo**:
  - Fuerza: +0,125% de regeneración de salud y +0,2 de peso transportable.
  - Destreza: +0,185% de regeneración de aguante y +0,15% de índice de evasión.
  - Intelecto: +0,185% de regeneración de eitr y +0,16 de escudo rúnico.
- **Regenerar después de una actualización**:

  ```
  "<scratchpad>\tools\dotnet\dotnet.exe" "<scratchpad>\tools\ilspycmd\tools\net10.0\any\ilspycmd.dll" PathOfValheiman.dll -r "<Valheim>\valheim_Data\Managed" -r "<perfil>\BepInEx\core" -r "<perfil>\BepInEx\plugins\ValheimModding-Jotunn" -o <carpeta>
  node "D:\PoV Builder\extraer_reglas.js" <carpeta>\PathOfValheiman.decompiled.cs "D:\PoV Builder\res"
  ```

  Después se corre `generar.js`, que lee `res\reglas_mod.json`.

## Fuentes externas consultadas (2026-10-26)

- **povdb.wiki** (wiki de la comunidad, generada con los archivos y el código del juego): se usó para confirmar cómo se muestran los porcentajes. Es la mejor referencia para comparar textos.
- **Discord oficial (treextr)**: el FAQ da la fórmula de stats. Un jugador confirma que las maestrías cuestan puntos. No hay nada sobre límites de keystones ni sobre si la opción es obligatoria.- **valheiman.com**: solo dice "coming soon".
- **povbuilds.com**: planificador de la comunidad; avisa que no aplica todas las reglas del juego, así que no se usó como fuente.
