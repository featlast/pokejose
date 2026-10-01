# Spec 001 — Pokédex

> Fase **Specify** (SDD). Qué y por qué, no cómo. Fuente: documento de requisitos
> *Pokedex Challenge* (React Native). Cada requisito tiene un ID y un criterio de aceptación (CA) verificable.

## Historias de usuario

- **HU-1.** Como usuario quiero ver un listado de Pokémon con nombre e imagen para explorarlos.
- **HU-2.** Como usuario quiero tocar un Pokémon y ver su detalle (tipos, habilidades,
  estadísticas, peso, altura, experiencia base).
- **HU-3.** Como usuario quiero seguir viendo lo que ya consulté aunque no tenga conexión.
- **HU-4.** Como usuario de lector de pantalla quiero que la app sea navegable y comprensible.

## Requisitos funcionales

| ID | Requisito | Criterio de aceptación | Origen (PDF) |
|----|-----------|------------------------|--------------|
| FR-01 | Listado inicial con los primeros 20 Pokémon de PokéAPI | Al abrir la app se solicitan `limit=20&offset=0` y se muestran 20 tarjetas | §2, §3 UI |
| FR-02 | Cada elemento muestra nombre e imagen | La tarjeta renderiza nombre capitalizado, número e imagen oficial | §3 UI |
| FR-03 | Estados visuales de carga, error y vacío | Carga → skeleton; error → mensaje amigable + "Reintentar"; lista vacía → vista vacía | §3 UI |
| FR-04 | Navegación listado → detalle | Tocar una tarjeta apila la pantalla de detalle con el Pokémon seleccionado | §3 Navegación |
| FR-05 | Regreso fluido | Botón atrás, botón físico de Android y gesto de borde en iOS regresan; el listado conserva su scroll | §3 Navegación |
| FR-06 | Detalle con datos relevantes | Muestra tipos, habilidades (incl. ocultas), 6 estadísticas, peso (kg), altura (m) y experiencia base | §3 Detalle |
| FR-07 | Consumo de PokéAPI desacoplado de la UI | Ningún componente importa `fetch` ni DTOs; la UI solo consume casos de uso | §3 API |
| FR-08 | Manejo de éxito, error, carga y fallos de conectividad | Errores de red, timeout, 404, 5xx y parseo se traducen a mensajes para el usuario | §3 API |
| FR-09 | Persistencia local | Listado y detalles consultados se guardan en disco y sobreviven a reinicios | §3 Persistencia |
| FR-10 | Experiencia offline parcial | Sin red, se muestran los datos cacheados (aunque estén vencidos) con un aviso de "datos sin conexión" | §3 Persistencia |
| FR-11 | Consistencia de datos | El caché tiene TTL y versión de esquema; datos vencidos se refrescan cuando hay red; pull-to-refresh fuerza actualización | §3 Persistencia |

## Requisitos bonus

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| BR-01 | Paginación incremental | Al acercarse al final del listado se cargan los siguientes 20 con indicador de pie |
| BR-02 | UX: skeletons, animaciones sutiles | Skeleton pulsante, transición deslizante entre pantallas, barras de stats animadas |
| BR-03 | Testing | Pruebas unitarias (mappers, http, caché, repositorio, reducers) y de componentes/integración |
| BR-04 | Manejo centralizado de errores | Un único `AppError` + `ErrorCode` y un único traductor a mensajes amigables |
| BR-05 | Accesibilidad | Roles, labels, `progressbar` en stats, áreas táctiles ≥ 44 pt, contraste AA, modo oscuro |
| BR-06 | Rendimiento | `FlatList` virtualizada, `React.memo`, callbacks estables, caché en disco + memoria de imágenes |
| BR-07 | Documentación de decisiones | `plan.md` con decisiones (ADR) y trade-offs |
| BR-08 | Linting / formato / CI | ESLint + Prettier + workflow de GitHub Actions (tsc, lint, test) |
| BR-09 | Identidad de arranque: icono y splash animado | Icono propio en Android (adaptativo) e iOS. Al abrir la app, un splash nativo sin saltos da paso a una animación (caída, captura, apertura, destello) que termina en el fondo del tema; los datos cargan en paralelo; con "Reducir movimiento" solo hay un fundido |

## Requisitos no funcionales

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| NFR-01 | Sin librerías externas | `dependencies` contiene solo `react` y `react-native` |
| NFR-02 | TypeScript estricto | `tsc --noEmit` sin errores; no se usa `any` |
| NFR-03 | Organización identificable | Modelos, interfaces, enums, types y DTOs en carpetas/sufijos dedicados |
| NFR-04 | Android e iOS | Build exitoso en ambas plataformas; respeta safe area (notch, barra de gestos, edge-to-edge) |
| NFR-05 | Adaptable a tamaños de pantalla | Columnas del grid calculadas según ancho (2 en teléfono, 3–5 en horizontal/tablet). *Enmienda tras evaluación: se admiten 5 columnas en tablets grandes (≥ 1000 dp).* |
| NFR-06 | Clean Architecture + SOLID + DI | El dominio no depende de React Native; repositorios y fuentes de datos detrás de interfaces |
| NFR-07 | Entregable reproducible | README con instalación, ejecución y pruebas sin pasos ambiguos |

## Fuera de alcance

Búsqueda, filtros, favoritos, evoluciones, internacionalización completa, i18n de nombres de
habilidades (se muestran como los entrega la API).

> La búsqueda y otras mejoras de experiencia se especifican en
> [`specs/002-ux-enhancements/spec.md`](../002-ux-enhancements/spec.md).
