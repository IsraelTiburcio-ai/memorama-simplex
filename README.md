# Memorama Simplex

**Subtítulo:** Encuentra la pareja correcta

Microjuego educativo de memorama para reforzar conceptos del **Gimnasio 3. Método Simplex** (Optimización I). Está pensado primero para celular (390 × 844) y también se ve bien en iPad (retrato y apaisado) y escritorio.

**Producción:** https://israeltiburcio-ai.github.io/memorama-simplex/

## Objetivo académico

Ayudar a memorizar y distinguir conceptos de **forma canónica** y **equivalencias**: relacionar un concepto o expresión con su definición o equivalente correcto. El juego no resuelve modelos completos.

Temas del banco (11 temas, 28 parejas):

| Tema | Páginas del cuadernillo |
|---|---|
| Forma canónica de maximización y minimización | 4-5 |
| Lado derecho negativo y origen fuera de la región factible | 4 |
| Máx ↔ mín (equivalencia 1) | 6 |
| Desigualdades ≤ y ≥ (equivalencia 2) | 6 |
| Igualdad como intersección de desigualdades (equivalencia 3) | 6 |
| Variable de holgura (equivalencia 4a) | 6 |
| Variable de exceso (equivalencia 4b) | 7 |
| Variable no restringida (equivalencia 5) | 7 |
| Variables ≤ 0 y cambio de variable | 7-8 |
| Pasos para transformar a forma canónica | 7 |
| Variable artificial, modelo ampliado (apoyo conceptual) | 25-26 |

## Fuente

Cuadernillo **Gimnasio 3. Método Simplex**, páginas 4-8 (3.1 Forma canónica y 3.2 Equivalencias). Las respuestas de referencia son las del propio cuadernillo; las definiciones se mantienen compatibles con su redacción. El tema de variable artificial se toma de las páginas 25-26 como apoyo conceptual.

El banco distingue forma canónica de las condiciones para iniciar simplex desde el origen: el cuadernillo indica que un lado derecho negativo puede dejar el origen fuera de la región factible.

## Mecánica

- Se muestran 16 cartas boca abajo (8 parejas).
- Cada turno se voltean dos cartas. Si forman pareja, quedan a la vista y aparece una frase breve de confirmación. Si no, se vuelven a ocultar con el mensaje "No forman pareja.".
- Cada partida toma **8 parejas al azar de temas distintos**, así una misma pareja no aparece dos veces con definiciones contradictorias y la experiencia cambia entre partidas. La partida siguiente evita, siempre que sea posible, repetir las parejas de la anterior.
- Marcador: tiempo, parejas encontradas, intentos y precisión.
- Resumen final: tiempo total, errores, porcentaje de aciertos, repaso de las 8 parejas y botón **Volver a jugar**.

## Duración

Entre **1 y 2 minutos** por partida (8 parejas). El cronómetro empieza al voltear la primera carta y se pausa si la pestaña queda oculta.

## Accesibilidad

- Foco visible en todos los controles y cartas.
- Teclado: Tab para moverse, Enter o Espacio para voltear, flechas para cambiar de carta, Esc para cerrar el resumen.
- Cada carta tiene `aria-label` (posición, estado y texto). Los mensajes de acierto y error se anuncian en una región `aria-live`.
- No depende solo del color: las cartas acertadas muestran etiqueta de tema y un icono de verificación; los errores muestran texto.
- `prefers-reduced-motion`: se desactivan las animaciones de volteo, pulso y sacudida.
- Botón de silencio con `aria-pressed`.

## Audio

Efectos sintetizados con Web Audio API (volteo, acierto, error leve y victoria). No hay música automática. El botón de silencio guarda la preferencia en el navegador.

## Stack

- HTML, CSS y JavaScript vanilla (sin dependencias ni compilación).
- Web Audio API para los efectos de sonido.
- GitHub Pages con GitHub Actions para el despliegue automático (`.github/workflows/pages.yml`).

## Ejecución local

No requiere instalación. Opciones:

1. Abrir `index.html` en el navegador.
2. O bien, desde esta carpeta, levantar un servidor local:

```bash
python3 -m http.server 8000
```

Luego abrir http://localhost:8000.

## Estructura

```
index.html            pantallas, marcador y resumen
styles.css            diseño mobile-first, iPad y escritorio
script.js             lógica de partida, selección aleatoria, sonido y accesibilidad
data.js               banco de parejas (contenido académico)
assets/icon.svg       icono del juego
.github/workflows/    despliegue a GitHub Pages
```

## Cómo agregar o editar parejas

Editar el arreglo `PAIRS` en `data.js`. Cada pareja tiene:

```js
{ id: "S1", topic: "slack",
  a: "Variable de holgura",                                  // carta 1 (HTML permitido: <sub>, &lt;)
  b: "Se agrega a una restricción ≤ para convertirla en igualdad", // carta 2
  ok: "una variable de holgura se agrega a una restricción ≤." }   // mensaje tras acertar (texto plano)
```

Reglas para mantener el juego justo:

- Cada tema debe tener como máximo una pareja activa por partida (el juego ya lo garantiza).
- Los textos de las cartas no deben repetirse entre parejas.
- El campo `ok` no debe contener `<` ni `&`.
