# Plan técnico 004: Debilidades y resistencias

## 1. Encaje en Clean Architecture

| Capa | Cambio |
|---|---|
| Domain | Modelos `TypeChart` (tipo defensor → tipo atacante → multiplicador ≠ 1) y `TypeMatchups`. Interfaz `PokemonTypeChartRepository`. `GetTypeMatchupsUseCase` + función pura `defensiveMatchups(chart, tipos)` |
| Data | `TypeResponseDto.damage_relations`. Mapper `mapTypeResponsesToChart`. `TypeIndexSnapshot` suma `chart`. `PokemonTypeIndexRepositoryImpl` implementa también `PokemonTypeChartRepository` sobre el mismo snapshot cacheado |
| DI | Una sola instancia del repositorio de tipos sirve a índice y tabla. `AppDependencies` suma `getTypeMatchups` |
| Presentation | `useTypeMatchups` (carga en segundo plano, silenciosa ante fallos), componente `TypeMatchupChip` y la sección en `PokemonDetailContent` |

## 2. Decisiones técnicas

### ADR-18 · Tabla de tipos desde la API, no escrita a mano
- **Contexto:** la tabla de tipos podría escribirse en el código, pero la app ya descarga las 18
  respuestas de `/type/{nombre}` y cada una trae `damage_relations`.
- **Decisión:** se usa la vista **defensiva** de cada respuesta (`double_damage_from`,
  `half_damage_from`, `no_damage_from`): es justo lo que necesita el detalle y no hay que invertirla.
- **Caché:** la tabla viaja en el mismo snapshot del índice. Como cambia su forma, se sube
  `CACHE_CONFIG.schemaVersion` a 4 y el snapshot anterior se descarta solo (se vuelve a descargar una vez).
- **Índice parcial:** si falló algún tipo, a la tabla le falta ese defensor; el dominio devuelve `null`
  para los Pokémon con ese tipo en lugar de un cálculo incorrecto.
