# Plan técnico 003: Filtros por tipo

> Fase **Plan** (SDD). Cómo se satisface `spec.md` de la 003 sin romper la arquitectura.

## 1. Encaje en Clean Architecture

| Capa | Cambio |
|---|---|
| Domain | `SearchPokemonUseCase.execute(query, type?)` recibe además `PokemonTypeIndexRepository`. Función pura `filterByType(list, typeIndex, type)` (cualquier slot). Sin tipo ni texto devuelve `[]` como hoy |
| Data | Sin cambios: el índice de tipos (ADR-10) ya cubre los 1025 Pokémon y sus formas |
| DI | `container.ts` inyecta el repositorio de tipos al caso de uso de búsqueda |
| Presentation | `usePokemonSearch` suma `typeFilter` (sin *debounce*); el reducer guarda `typeFilter` y descarta respuestas de un criterio viejo. Componentes `TypeFilterBar` y `TypeFilterChip`. `CollapsingHeader` recibe un slot `belowSearch` con su alto; `useCollapsingHeaderLayout(extraHeight)` lo suma al header |

## 2. Decisiones técnicas

### ADR-15 · El filtro es un criterio más de la búsqueda
- **Contexto:** filtrar solo las páginas cargadas mostraría resultados incompletos, y paginar por tipo
  exigiría peticiones nuevas.
- **Decisión:** el filtro reutiliza el flujo de búsqueda: mismo estado (`SearchStatus`), misma capa de
  resultados sobre el listado paginado (que conserva su scroll) y mismos estados vacío/error. El caso de
  uso cruza el índice de nombres con el índice de tipos en memoria.
- **Consecuencia:** con un tipo activo y sin texto, el estado es "buscando" aunque no haya término; el
  reducer compara término **y** tipo para ignorar respuestas viejas.

### ADR-16 · Fila de filtros dentro del header animado
- La fila es parte del `Animated.View` del header (se traslada con él en el driver nativo), en una franja
  con el fondo de la app debajo de la parte roja. Así sigue el colapso sin cálculos extra y recibe
  toques en Android (un hijo fuera de los límites del padre no los recibe).
- El alto de la fila es fijo (`TYPE_FILTER_ROW_HEIGHT`): las etiquetas limitan su escala de fuente
  para no romperlo.

### ADR-17 · Sombras e íconos sin librerías
- **Sombras:** `boxShadow` de RN (nueva arquitectura) con varias capas: color del tipo con alfa
  (`#RRGGBBAA`), contacto negra y `inset` para el brillo. Igual en Android e iOS.
- **Íconos:** 18 PNG blancos sobre transparente (@1x/@2x/@3x) dibujados como SVG y rasterizados con
  Chrome headless; la Pokéball de **Todos** va a color. Viven en `src/presentation/assets/types`.
