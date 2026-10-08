# Spec 003: Filtros por tipo

> Fase **Specify** (SDD). Habilita los filtros por tipo que la spec 002 dejó fuera de alcance,
> reutilizando el índice de tipos de FR-207 (sin peticiones nuevas).
> Se rige por `specs/constitution.md`: **cero dependencias externas**, Clean Architecture y SOLID.
> Diseño aprobado por el usuario sobre una maqueta interactiva en Pixel 10 Pro
> (fila debajo del header, círculos con sombra).

## Historias de usuario

- **HU-13.** Como usuario quiero ver solo los Pokémon de un tipo (Fuego, Agua, Eléctrico…) con un toque, sin escribir.

## Requisitos funcionales

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| FR-301 | Fila de filtros | Bajo la barra de búsqueda hay una fila con scroll horizontal de círculos: **Todos** y los 18 tipos jugables (sin Astral ni Desconocido), cada uno con el color de su cinta (`TYPE_APPEARANCE`), un ícono blanco y su nombre en español debajo |
| FR-302 | Filtrar por tipo | Tocar un tipo muestra **todos** los Pokémon que tienen ese tipo en **cualquiera de sus slots** (Charizard aparece en Fuego y en Volador), de toda la Pokédex y no solo de las páginas cargadas. Tocar el tipo activo o **Todos** quita el filtro y vuelve al listado paginado conservando su scroll |
| FR-303 | Estado seleccionado | El tipo activo muestra un anillo de su color, escala levemente y su nombre en negrita; los demás círculos se atenúan. Sin filtro, **Todos** queda seleccionado |
| FR-304 | Combinable con la búsqueda | Con un tipo activo, la búsqueda solo devuelve Pokémon de ese tipo. Limpiar la búsqueda conserva el filtro |
| FR-305 | Contador y vacío | El subtítulo dice "N Pokémon de tipo X" (o "N resultados de tipo X" si además hay búsqueda). Sin coincidencias: "No encontramos Pokémon de tipo X para “término”." |
| FR-306 | Fila fija al colapsar | La fila se mueve con el header: al colapsar el título, queda fija bajo la búsqueda. Al filtrar, el header se colapsa como al buscar (FR-215) y la primera fila de resultados queda completa bajo la fila (FR-224) |
| FR-307 | Tolerante a fallos | Si el índice de tipos todavía no está o falló, la fila no se muestra y la lista funciona como antes (FR-208) |
| FR-309 | Header del color del tipo | *Enmienda (pedido del usuario):* con un tipo activo, el header y la franja de la barra de estado pasan del rojo al color de ese tipo con un fundido de ~280 ms, y vuelven al rojo al quitar el filtro. Con "Reducir movimiento" el cambio es inmediato |
| FR-308 | Profundidad visual | Cada círculo tiene sombra difusa teñida con el color del tipo, sombra de contacto y brillo interior; el seleccionado tiene una sombra más amplia. Se encoge al presionarlo |

## Requisitos no funcionales

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| NFR-301 | Cero dependencias | Sombras con `boxShadow` nativo de RN (Fabric) e íconos PNG @1x/@2x/@3x propios: sin librerías de SVG ni de sombras |
| NFR-302 | Clean Architecture | El criterio de filtrado vive en el dominio (`SearchPokemonUseCase`), que combina los repositorios de búsqueda y de tipos por sus interfaces. La UI no filtra listas |
| NFR-303 | Accesibilidad | Cada círculo tiene `accessibilityRole="button"`, `accessibilityState.selected`, etiqueta "Filtrar por tipo X" (o "Mostrar todos los tipos") y un área táctil ≥ 48. Con "Reducir movimiento" el cambio de selección no se anima |
| NFR-304 | Rendimiento | Las animaciones de selección corren en el driver nativo. Filtrar recorre el índice en memoria (~1350 entradas) |
| NFR-305 | Pruebas | Dominio (cualquier slot, combinación con búsqueda), reducer (respuestas viejas descartadas), mensajes e integración (tocar un tipo filtra; tocar de nuevo vuelve al listado) |

## Decisiones tomadas

- **Posición:** debajo del header, sobre el fondo de la app (en el header rojo, Fuego y Lucha se confundían).
- **Tipos contados:** cualquiera de los tipos del Pokémon, no solo el principal (con solo el principal, Volador quedaría casi vacío).
- **Formas alternativas:** se incluyen en los resultados filtrados, igual que en la búsqueda (ADR-10).
