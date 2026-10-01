# Tareas 002: Mejoras de experiencia

> Fase **Tasks** (SDD). `[P]` = paralelizable. Cada fase es entregable por separado y cierra con
> las compuertas (`npm run validate` + builds Android/iOS) y una revisión del agente evaluador.
> **La shared transition es la última fase por decisión del usuario.**

## Fase A: Carga y skeleton
- [x] A1 [P] `useMinimumDuration` + pruebas con fake timers (FR-203)
- [x] A2 [P] `Shimmer` en el driver nativo + "Reducir movimiento" (FR-201, NFR-205)
- [x] A3 [P] `useSkeletonCount` según viewport y columnas (FR-202)
- [x] A4 [P] `ProgressiveImage`: placeholder, *fade-in* y fallback de error (FR-204)
- [x] A5 Precarga de la página siguiente desde el view model (FR-205)

## Fase B: Cinta de tipo
- [x] B1 Dominio: `PokemonTypeIndex` (modelo), `PokemonTypeIndexRepository` (interfaz), caso de uso (NFR-202/203)
- [x] B2 Extraer `CachePolicy` genérica de `PokemonRepositoryImpl` sin cambiar su comportamiento (OCP) + pruebas de regresión
- [x] B3 Data: DTO `/type`, mapper (slot; incluye formas alternativas, esquema de caché v2), remoto + local + repositorio (FR-207, ADR-10)
- [x] B4 `TypeRibbon` diagonal con contraste AA + label accesible (FR-206, NFR-205)
- [x] B5 View model: cruzar índice e ítems; la cinta aparece con *fade-in* cuando llega el índice (FR-208)

## Fase C: Tema
- [x] C1 Dominio: `ThemePreference` (enum), `ThemePreferenceRepository`, casos de uso Get/Set
- [x] C2 Data: repositorio sobre `KeyValueStorage` (FR-210)
- [x] C3 `ThemeProvider` (reemplaza `useTheme`) + carga previa sin destello (FR-210, ADR-12)
- [x] C4 `ThemeToggle` en el header + `Appearance.setColorScheme` (FR-209, FR-211)
- [x] C5 Revisión visual en oscuro: splash, hero, banners, cinta + capturas
- [x] C6 Enmienda FR-210: arrancar siempre en "Sistema" y retirar la persistencia del tema (repositorio, casos de uso Get/Set, DI, pruebas) (FR-210, ADR-12)
- [x] C7 Iconos de tema propios (Lumen) en `ThemeToggle` con transición y "Reducir movimiento" (FR-222)

## Fase D: Búsqueda y header colapsable
- [x] D1 Dominio: `PokemonSearchIndexRepository`, `SearchPokemonUseCase` (normalización, número) (FR-212)
- [x] D2 Data: DTO/mapper del índice de nombres, remoto + local con TTL (FR-213, ADR-11)
- [x] D3 `useDebouncedValue` + estado de búsqueda en el view model (FR-213, FR-214)
- [x] D4 `SearchBar` accesible (limpiar, teclado, `returnKeyType`) (FR-212)
- [x] D5 `CollapsingHeader` + `useCollapsingHeader` con ícono de la app (FR-215, ADR-13)
- [x] D6 Convivencia con pull-to-refresh y safe area en ambas plataformas (FR-216). Android verificado en emulador; en iOS falta la prueba manual de gestos (scroll y pull-to-refresh)

## Fase E: Shared transition (al final)
- [x] E1 `SharedElementRegistry` + registro desde `PokemonCard` y el hero del detalle
- [x] E2 Capa overlay en `StackNavigator`: medición, vuelo de ida y vuelta, ocultar originales (FR-217, ADR-14). Verificado en Android con grabación de pantalla, a velocidad real y en cámara lenta
- [x] E3 Fallback a la transición lateral + gesto de borde en iOS + botón atrás de Android
- [x] E4 "Reducir movimiento" y pruebas

## Fase F: Pull-to-refresh y volver arriba
- [x] ~~F1 [P] Assets `orb` (@1x/@2x/@3x, reducidos de las capas `splash` @3x) + `PokeballOrb` (FR-218)~~ *(retirado)*
- [x] ~~F2 [P] `ProgressRing` sin SVG en el driver nativo (FR-218, FR-220)~~ *(retirado)*
- [x] ~~F3 [P] Nativo Android: spec codegen `PullRefreshLayout` + vista Kotlin *nested scroll* + ViewManager (FR-219, ADR-16)~~ *(retirado)*
- [x] ~~F4 `usePullToRefresh` (iOS por offset, Android por eventos nativos) + `PullToRefreshIndicator` (FR-218, FR-219)~~ *(retirado)*
- [x] F5 `useScrollToTop` + `ScrollToTopButton` (FR-220). Rediseñado: `CircleButton` elevado + `Chevron`; se quitaron el anillo y la medición de profundidad
- [x] F6 Integración en el listado y la búsqueda, tema y "Reducir movimiento" (FR-221, NFR-208)
- [x] F7 Pruebas + compuertas (validate, Android, iOS). Android verificado en emulador (release): pull, recarga, cierre y volver arriba, en claro y en oscuro. En iOS compila y arranca, pero falta la prueba manual de gestos (el simulador no permite simular arrastres desde la terminal)
- [x] F8 Retiro del pull-to-refresh propio por decisión del usuario: vuelve el `RefreshControl` nativo (`primary`, `progressViewOffset`); se borran indicador, anillo, orb, `assets/orb`, el componente nativo Android y su spec (`codegenConfig.type` = `modules`). Las pruebas de volver arriba quedan en `scrollToTop.test.tsx`

## Fase G: Ajustes tras probar en dispositivo
- [x] G1 Listado sobre `/pokemon-species` (1025), caché v3 y mensaje para números fuera de rango (FR-223, ADR-17)
- [x] G2 Resultados de búsqueda sin `contentInset` en iOS (FR-224, ADR-17) + pruebas; verificado en iOS y Android

## Cierre
- [x] Z1 README (funcionalidades, ADR 10–15, trade-offs) + capturas en claro/oscuro
- [x] Z2 Revisión independiente del agente evaluador contra esta spec
