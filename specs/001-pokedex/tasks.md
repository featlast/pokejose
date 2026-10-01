# Tareas 001 — Pokédex

> Fase **Tasks** (SDD). Cada tarea referencia los requisitos que satisface. Las marcadas con
> `[P]` son paralelizables (sin dependencias entre sí) y son las que el orquestador reparte
> entre workers (ver `AGENTS.md`).

## Fase 0 — Fundaciones
- [x] T00 Eliminar dependencias externas del template (`safe-area-context`, `new-app-screen`) — NFR-01
- [x] T01 Constitución, spec y plan — BR-07

## Fase 1 — Núcleo y dominio
- [x] T10 [P] `core/errors`: `ErrorCode`, `AppError`, `toAppError`, `errorMessages` — FR-08, BR-04
- [x] T11 [P] `core/http`: `HttpClient` + `FetchHttpClient` (timeout, mapeo de status) — FR-07, FR-08
- [x] T12 [P] `core/storage`: `KeyValueStorage` + adaptador nativo + in-memory — FR-09
- [x] T13 [P] `domain`: modelos, enums, interfaz de repositorio y casos de uso — NFR-06

## Fase 2 — Datos
- [x] T20 [P] DTOs de PokéAPI y mappers — FR-06, NFR-03
- [x] T21 [P] `PokeApiRemoteDataSource` — FR-01, FR-07
- [x] T22 [P] `PokemonLocalDataSource` (TTL + versión de esquema) — FR-09, FR-11
- [x] T23 `PokemonRepositoryImpl` (cache-first + respaldo stale) — FR-10, FR-11

## Fase 3 — Nativo
- [x] T30 [P] Spec de codegen `NativeKeyValueStore` + Kotlin + Swift — FR-09, ADR-01
- [x] T31 [P] Spec de codegen `NativeSafeArea` + Kotlin + Swift — NFR-04, ADR-07

## Fase 4 — Presentación
- [x] T40 Tema (claro/oscuro, colores por tipo) — BR-05
- [x] T41 Stack navigator tipado + BackHandler + gesto de borde — FR-04, FR-05
- [x] T42 [P] Componentes: tarjeta, skeleton, error, vacío, badge, barra de stat, header — FR-02, FR-03, BR-02
- [x] T43 Listado: view model + reducer + paginación + pull-to-refresh — FR-01, FR-03, BR-01
- [x] T44 Detalle: view model + pantalla — FR-06
- [x] T45 DI container + provider + App — NFR-06

## Fase 5 — Calidad (Evaluator)
- [x] T50 Pruebas unitarias y de componentes — BR-03
- [x] T51 ESLint/Prettier/tsc + GitHub Actions — BR-08
- [x] T52 Build Android e iOS — NFR-04
- [x] T53 README + evidencias — NFR-07
- [x] T54 Revisión independiente contra la spec (agente evaluador) — todos

## Fase 6 — Identidad de arranque
- [x] T60 Icono Lumen modelado en Blender: adaptive icon Android + AppIcon iOS — BR-09
- [x] T61 Capas del splash exportadas desde Blender — BR-09, ADR-09
- [x] T62 Splash nativo (LaunchScreen, tema Android, SplashScreen API 31+) — BR-09, NFR-04
- [x] T63 `AnimatedSplash` + línea de tiempo + reducir movimiento — BR-09, BR-05
- [x] T64 Pruebas de la línea de tiempo y del splash; compuertas — BR-03, BR-09
