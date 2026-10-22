# Piloto opcional de integración con OptiLab

El juego conserva su URL, reglas, selección aleatoria y banco académico. `data.js` no cambia.

Cuando se abre sin padre, `optilab-bridge.js` no establece conexión ni envía mensajes. Al abrirse dentro de OptiLab valida padre, origen permitido, referrer, sesión, versión, esquema e identificador antes de responder a `host:init`. Nunca usa `postMessage('*')`.

- `game:ready`: handshake recibido y validado.
- `game:started`: primera carta de una partida; nuevo UUID v4.
- `game:completed`: función `finish`, tras encontrar las ocho parejas; tiempo, intentos, errores y precisión reales.

El host es `https://israeltiburcio-ai.github.io/optilab/`. Desarrollo permite localhost/127.0.0.1 con referrer concordante. Sin referrer válido no se activa la integración; el juego sigue siendo independiente.

El tema `optilab-theme.css` solo se activa tras el handshake. Las etiquetas de las cartas acertadas pasan al flujo para no tapar el texto en el iframe móvil. El repaso final es enfocable y participa en el orden de tabulación del diálogo.

El protocolo completo, validaciones del host, límites de confianza del origen compartido y pruebas están documentados en [OptiLab: integración de juegos](https://github.com/IsraelTiburcio-ai/optilab/blob/main/docs/INTEGRACION-JUEGOS.md).

Resultado cliente/local, no una certificación ni un sistema antitrampas. El host conserva una alternativa al juego independiente si no logra conectar.
