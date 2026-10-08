# Spec 005: Cadena evolutiva

> Fase **Specify** (SDD). Muestra en el detalle la cadena evolutiva del Pokémon y cómo evoluciona.
> Se rige por `specs/constitution.md`: **cero dependencias externas**, Clean Architecture y SOLID.
> Diseño aprobado por el usuario sobre una maqueta interactiva en Pixel 10 Pro (Charmander, Eevee, Tauros).

## Historias de usuario

- **HU-15.** Como usuario quiero ver de qué Pokémon viene y en cuáles se convierte, y qué necesita para evolucionar.

## Requisitos funcionales

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| FR-501 | Sección "Evoluciones" | Aparece en el detalle justo después de la imagen principal, con todos los miembros de la cadena (imagen, nombre y número) |
| FR-502 | Cadena lineal | Si ningún Pokémon de la cadena tiene más de una evolución (Charmander), las etapas se muestran en una fila unida por flechas con la condición de cada paso |
| FR-503 | Cadena con ramas | Si hay ramas (Eevee, Oddish, Wurmple), la parte lineal inicial va en fila y, desde el punto donde se divide, cada evolución es una tarjeta en dos columnas con su condición; si viene de otro miembro que no es el punto de división, la tarjeta dice "de X" |
| FR-504 | Sin evolución | Si la cadena tiene un solo miembro (Tauros), se muestra "X no evoluciona" |
| FR-505 | Condiciones legibles | Nivel → "Nv. 16". Objeto → nombre en español de las piedras y objetos de evolución más comunes (resto con formato legible); las piedras elementales llevan un punto del color de su tipo. Amistad → "♥ Amistad", con "☀ Día" / "☾ Noche" y "mov. X" si aplican. Intercambio → "⇄ Intercambio" (o "con X"). Sexo → "♀" / "♂". Otros disparadores → "Condición especial" |
| FR-506 | Condición por defecto | Si un paso trae varias condiciones según el juego, se usa la marcada `is_default`; si no hay, la última (la más reciente) |
| FR-507 | Navegar por la cadena | El Pokémon actual lleva un anillo del color de su tipo y no es tocable. Tocar otro abre su detalle; Atrás regresa al anterior |
| FR-508 | Datos y caché | `/pokemon-species/{id}` → `/evolution-chain/{id}`. La cadena se guarda 7 días **bajo cada uno de sus miembros**: abrir Charizard después de Charmander no hace peticiones |
| FR-509 | Formas alternativas | El detalle conoce su especie (`species`): una forma (#10001+) muestra la cadena de su especie |
| FR-510 | Tolerante a fallos | Si la cadena no se puede obtener, la sección no se muestra y el detalle funciona igual. El detalle nunca la espera |

## Requisitos no funcionales

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| NFR-501 | Cero dependencias | Solo `react` y `react-native` |
| NFR-502 | Clean Architecture | Modelo `EvolutionChain` y repositorio `PokemonEvolutionRepository` en dominio; DTOs, mapper, remoto, local y repositorio en data. La UI no conoce la forma de la API |
| NFR-503 | Accesibilidad | Cada miembro se anuncia como "Charmeleon, evoluciona de Charmander al nivel 16"; el actual, como "estás viendo este Pokémon" y sin rol de botón |
| NFR-504 | Pruebas | Mapper (condición por defecto, árbol), repositorio (caché compartida), textos de condiciones, layout (lineal/ramas/sin evolución) e integración (tocar abre el detalle) |

## Fuera de alcance

- Megaevoluciones y formas regionales: la API no las incluye en `evolution-chain`.
