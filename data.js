/*
 * MEMORAMA SIMPLEX · banco de parejas (28 parejas, 11 temas)
 *
 * Fuente: cuadernillo "Gimnasio 3. Método Simplex"
 *   3.1 Forma canónica ......... pp. 4-5
 *   3.2 Equivalencias .......... pp. 6-8
 *   Variable artificial ........ pp. 25-26 (apoyo conceptual)
 *
 * Campos de cada pareja:
 *   id     código interno
 *   topic  tema (ver TOPICS). Una partida toma una sola pareja por tema.
 *   a      carta 1: concepto o expresión (HTML permitido: <sub>, &lt;)
 *   b      carta 2: definición o equivalente (HTML permitido)
 *   ok     explicación breve tras acertar (texto plano, sin "<" ni "&")
 */
(function () {
  "use strict";

  var TOPICS = {
    forma:      { name: "Forma canónica",          color: "#1d4ed8", pages: "pp. 4-5" },
    maxmin:     { name: "Máx ↔ mín",               color: "#7c3aed", pages: "p. 6" },
    leq:        { name: "Desigualdad ≤",           color: "#0f766e", pages: "p. 6" },
    geq:        { name: "Desigualdad ≥",           color: "#0e7490", pages: "p. 6" },
    eq:         { name: "Igualdad",                color: "#4338ca", pages: "p. 6" },
    slack:      { name: "Variable de holgura",     color: "#15803d", pages: "p. 6" },
    surplus:    { name: "Variable de exceso",      color: "#b45309", pages: "p. 7" },
    free:       { name: "Variable no restringida", color: "#be185d", pages: "p. 7" },
    sign:       { name: "Variable ≤ 0",            color: "#475569", pages: "pp. 7-8" },
    steps:      { name: "Transformación",          color: "#334155", pages: "p. 7" },
    artificial: { name: "Variable artificial",     color: "#9a3412", pages: "pp. 25-26" }
  };

  var PAIRS = [
    /* 3.1 Forma canónica (pp. 4-5) */
    { id: "F1", topic: "forma",
      a: "Forma canónica de maximización",
      b: "Max z, restricciones ≤ y variables no negativas",
      ok: "en maximización, todas las restricciones son ≤ y las variables son no negativas." },
    { id: "F2", topic: "forma",
      a: "Forma canónica de minimización",
      b: "Min z, restricciones ≥ y variables no negativas",
      ok: "en minimización, todas las restricciones son ≥ y las variables son no negativas." },
    { id: "F3", topic: "forma",
      a: "Restricción ≤ con b<sub>i</sub> &lt; 0",
      b: "El origen no pertenece a la región factible",
      ok: "si el lado derecho es negativo, el origen queda fuera de la región factible." },

    /* Equivalencia 1 (p. 6) */
    { id: "M1", topic: "maxmin",
      a: "max z = cx",
      b: "Equivale a min z = −cx",
      ok: "max z = cx es equivalente a min z = −cx." },
    { id: "M2", topic: "maxmin",
      a: "min z = cx",
      b: "Equivale a max z = −cx",
      ok: "min z = cx es equivalente a max z = −cx." },
    { id: "M3", topic: "maxmin",
      a: "Efecto en z al cambiar max ↔ min",
      b: "Todos los coeficientes de z cambian de signo",
      ok: "al pasar de max a min (o al revés), z cambia de signo." },

    /* Equivalencia 2 (p. 6) */
    { id: "L1", topic: "leq",
      a: "Ax ≤ b",
      b: "Equivale a −Ax ≥ −b",
      ok: "multiplicar por −1 invierte la desigualdad: Ax ≤ b equivale a −Ax ≥ −b." },
    { id: "L2", topic: "leq",
      a: "3x₁ + 4x₂ − 3x₃ ≤ 1000",
      b: "Equivale a −3x₁ − 4x₂ + 3x₃ ≥ −1000",
      ok: "al multiplicar por −1 cambia el sentido de la desigualdad." },
    { id: "L3", topic: "leq",
      a: "Efecto de multiplicar una desigualdad por −1",
      b: "Cambia el sentido, pero no la región factible",
      ok: "la región factible y la solución no cambian; solo se reescribe la restricción." },
    { id: "G1", topic: "geq",
      a: "Ax ≥ b",
      b: "Equivale a −Ax ≤ −b",
      ok: "multiplicar Ax ≥ b por −1 da −Ax ≤ −b: la restricción queda en forma ≤." },
    { id: "G2", topic: "geq",
      a: "12x₁ − 4x₂ ≥ −200",
      b: "Equivale a −12x₁ + 4x₂ ≤ 200",
      ok: "al multiplicar por −1, la ≥ se vuelve ≤ y el lado derecho cambia de signo." },

    /* Equivalencia 3 (p. 6) */
    { id: "E1", topic: "eq",
      a: "Igualdad Ax = b",
      b: "Intersección de Ax ≤ b y Ax ≥ b",
      ok: "una igualdad equivale a la intersección de una desigualdad ≤ y una ≥." },
    { id: "E2", topic: "eq",
      a: "3x₁ + 2x₂ = 5",
      b: "3x₁ + 2x₂ ≥ 5 y 3x₁ + 2x₂ ≤ 5",
      ok: "la igualdad se separa en una desigualdad ≥ y otra ≤." },

    /* Equivalencia 4a (p. 6) */
    { id: "S1", topic: "slack",
      a: "Variable de holgura",
      b: "Se agrega a una restricción ≤ para convertirla en igualdad",
      ok: "una variable de holgura se agrega a una restricción ≤." },
    { id: "S2", topic: "slack",
      a: "14x₁ + 3x₂ ≤ 10",
      b: "Equivale a 14x₁ + 3x₂ + x₃ = 10, con x₃ ≥ 0",
      ok: "x₃ es la variable de holgura que convierte la ≤ en igualdad." },
    { id: "S3", topic: "slack",
      a: "Significado de la holgura",
      b: "Unidades que faltan para llegar a la capacidad máxima",
      ok: "la holgura mide lo que aún falta para usar toda la capacidad del recurso." },

    /* Equivalencia 4b (p. 7) */
    { id: "X1", topic: "surplus",
      a: "Variable de exceso",
      b: "Se resta en una restricción ≥ para convertirla en igualdad",
      ok: "una variable de exceso se resta en una restricción ≥." },
    { id: "X2", topic: "surplus",
      a: "16x₁ + 8x₂ ≥ 5",
      b: "Equivale a 16x₁ + 8x₂ − x₃ = 5, con x₃ ≥ 0",
      ok: "x₃ es la variable de exceso que convierte la ≥ en igualdad." },
    { id: "X3", topic: "surplus",
      a: "Significado del exceso",
      b: "Unidades que pasan del requerimiento mínimo",
      ok: "el exceso mide cuánto se sobrepasa el requerimiento mínimo." },

    /* Equivalencia 5 (p. 7) */
    { id: "N1", topic: "free",
      a: "Variable no restringida",
      b: "Se escribe como diferencia de dos variables no negativas",
      ok: "se escribe como x = x₃ − x₄, con x₃ y x₄ no negativas." },
    { id: "N2", topic: "free",
      a: "x₁ no restringida",
      b: "x₁ = x₃ − x₄, con x₃, x₄ ≥ 0",
      ok: "x₁ se reemplaza por la diferencia de dos variables no negativas." },
    { id: "N3", topic: "free",
      a: "x₁ = x₃ − x₄ con x₃ &lt; x₄",
      b: "Entonces x₁ &lt; 0",
      ok: "si x₃ es menor que x₄, la diferencia x₃ − x₄ es negativa." },

    /* Variables con signo (pp. 7-8) */
    { id: "V1", topic: "sign",
      a: "Variable x₂ ≤ 0",
      b: "Se cambia por x₂ = −x₄, con x₄ ≥ 0",
      ok: "una variable ≤ 0 se reemplaza por su negativo, que sí es no negativo." },
    { id: "V2", topic: "sign",
      a: "Para una variable x ≤ 0",
      b: "Cambio de variable con signo inverso",
      ok: "cuando x ≤ 0, el cambio de variable usa signo inverso." },

    /* Pasos de transformación (p. 7) */
    { id: "T1", topic: "steps",
      a: "Orden para transformar a forma canónica",
      b: "1) Función objetivo, 2) restricciones, 3) variables",
      ok: "primero se ajusta la f.o., después las restricciones y al final las variables." },

    /* Variable artificial (pp. 25-26) */
    { id: "A1", topic: "artificial",
      a: "Variable artificial",
      b: "Se agrega a restricciones = o ≥ para iniciar el simplex",
      ok: "se agrega en cada restricción que no tiene variable de holgura (= o ≥)." },
    { id: "A2", topic: "artificial",
      a: "Variables artificiales que no llegan a 0",
      b: "Se tiene solución no factible",
      ok: "si las artificiales no valen 0, el modelo original no tiene solución factible." },
    { id: "A3", topic: "artificial",
      a: "Modelo ampliado",
      b: "Forma estándar con variables artificiales agregadas",
      ok: "el modelo ampliado es la forma estándar con variables artificiales agregadas." }
  ];

  window.MEMORAMA_DATA = { topics: TOPICS, pairs: PAIRS };
})();
