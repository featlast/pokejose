# Plan técnico 006: Favoritos

## 1. Encaje en Clean Architecture

| Capa | Cambio |
|---|---|
| Domain | Interfaz `FavoritesRepository`. Reglas puras `toggleFavorite` (agrega al inicio o quita) y `restoreFavorite` (deshacer en su posición). Casos de uso `GetFavoritesUseCase`, `ToggleFavoriteUseCase`, `RestoreFavoriteUseCase`. `SearchPokemonUseCase.execute(query, filter)` con `{ type, favoritesOnly }` |
| Data | `FavoritesRepositoryImpl` sobre `KeyValueStorage` con clave propia y memoria |
| DI | Los tres casos de uso en `AppDependencies`; la búsqueda recibe también el repositorio de favoritos |
| Presentation | `FavoritesProvider` (estado compartido entre pantallas + aviso), `FavoriteButton` (tarjeta / header, animación de captura), `Snackbar`, chip Favoritos en `TypeFilterBar`, `ScreenHeader.trailing` |

## 2. Decisiones técnicas

### ADR-24 · Favoritos fuera de `StorageCache`
- `StorageCache` envuelve los datos con `schemaVersion` y TTL: un cambio de esquema (como v4/v5) los descarta.
  Eso sirve para datos de la API, pero borraría los favoritos del usuario. Se guardan directo en
  `KeyValueStorage` bajo `pokedex:favorites` con su propia versión (`{ version: 1, items }`), sin TTL.
- Si lo guardado está corrupto, se empieza con una lista vacía en lugar de romper la app.

### ADR-25 · Memoria como fuente de verdad
- El repositorio carga una vez y mantiene la lista en memoria; cada cambio actualiza la memoria al
  instante y persiste en segundo plano. Así la búsqueda (que lee el repositorio) ve el cambio sin
  esperar al disco y no hay carreras entre pantallas.

### ADR-26 · Filtro de favoritos como criterio de búsqueda
- Igual que los tipos (ADR-15): favoritos es un criterio más de `SearchPokemonUseCase`. Los candidatos
  son la lista de favoritos (en su orden) en vez del índice; luego aplican tipo y texto. La fila de
  filtros sigue siendo de selección única: Todos, Favoritos o un tipo.
