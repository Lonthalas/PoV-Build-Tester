# Verificación en el juego

Cada prueba dice qué hacer en el juego, qué mirar en el probador y qué anotar. Los resultados van a `pendientes.md` (o pasámelos y los cargo yo).

> **2026-10-27**: las pruebas 1 a 4 ya quedaron respondidas por el código del mod (ver `pendientes.md`). Si querés confirmar las reglas nuevas en el juego: (a) intentá abrir un segundo camino desde otro nodo inicial: el juego no debería dejarte; (b) asigná un "Cruce de atributos": no debería darte atributos ni cobrarte la opción; (c) asigná un nodo vecino a tu nodo inicial y fijate que el contador baje 1, no 2.

## Preparación (opcional, ahorra mucho tiempo)

En r2modman → perfil **PathOfTheValhemian** → *Config editor* → `treextr.pathofvalheiman.cfg`, sección **[6. Debug]**:

- `Set level`: pone al personaje en el nivel que elijas (al bajarlo, el mod saca los nodos más externos).
- `Debug points`: suma puntos de prueba. Al volver a 0 se quitan solos.

Usá un **personaje de prueba**, no tu personaje principal. Cuando termines, dejá los dos valores como estaban (`Set level = 1`, `Debug points = 0`).

## 1. ¿Cuántos puntos da cada nivel? (¿el nivel 1 ya da uno?)

1. Con un personaje nuevo (nivel 1), abrí el árbol y anotá los puntos disponibles.
2. Subí a nivel 2 (jugando o con `Set level = 2`) y anotá de nuevo.

- Si en nivel 1 tenés **1 punto**, el probador está bien (nivel × 1).
- Si tenés **0**, la fórmula real es (nivel − 1) y hay que corregirla.

## 2. ¿Cada nodo cuesta 1 punto?

Con algunos puntos libres, asigná un nodo de cada tipo y fijate cuánto baja el contador:

- un nodo **chico** (cualquiera pegado al inicio);
- un **notable**: "Sangre de hierro" (*Ironblood*), a 11 pasos del inicio por la rama de Fuerza;
- un **nodo clave**: "Horizonte lejano" (*own13780*, a 12 pasos) o "Reflejos de hierro" (*own13661*, a 13 pasos).

Anotá cuánto cuesta cada uno. El probador supone **1 punto** para todos.

## 3. Escala de los porcentajes

Pasá el mouse por estos nodos en el juego y compará con el probador (buscalos en el Catálogo):

| Nodo | Qué muestra el probador | ¿Qué dice el juego? |
|---|---|---|
| Sangre de hierro | +15% Regeneración de salud · +5 Armadura · +15 a Fuerza | |
| Giant's Belt | … +0.025% de resistencia al retroceso por cada 100 de peso máximo transportable | |
| Traveller's Megingjord | … −2.5% de costo con armas a dos manos por cada 100 de peso máximo transportable | |

Lo dudoso es el retroceso de Giant's Belt. Si el juego dice **2.5%** en vez de **0.025%**, la regla de los porcentajes "flat" está mal y hay que multiplicarlos por 100.

## 4. Maestrías repetidas

Hay notables con opciones que comparten grupo de maestría, por ejemplo:

- **Fuego**: "On Burning Coals" y "Smouldering Trail".
- **Tambaleo**: "Ringing Skull" y "Faltering Ranks".

Asigná los dos de un mismo grupo e intentá elegir **la misma opción** en ambos. Anotá qué pasa:

- el juego no te deja;
- te deja, pero solo cuenta una vez;
- te deja y se acumula.

El probador hoy solo muestra una advertencia.

## 5. Quitar un nodo del medio

Asigná una cadena de nodos y reembolsá uno del medio (cuesta monedas: 10 por punto con la config actual). Fijate si el juego también quita los que quedan desconectados del inicio, como hace el probador.

## 6. Límites que podrían existir

Mientras armás, fijate si en algún momento el juego te impide asignar algo por:

- un máximo de nodos clave;
- un máximo por categoría;
- incompatibilidad entre dos nodos.

Hoy el probador no tiene ninguno de esos límites.
