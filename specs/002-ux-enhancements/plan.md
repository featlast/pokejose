# Plan técnico 002: Mejoras de experiencia

> Fase **Plan** (SDD). Cómo se satisface `spec.md` de la 002 sin romper la arquitectura de la 001.

## 1. Encaje en Clean Architecture

Cada capacidad nueva sigue el mismo camino que la 001: **interfaz en dominio → implementación
en data → caso de uso → view model → vista**. Nada nuevo cruza capas por atajos.

| Capacidad | Domain | Data | Presentation |
|---|---|---|---|
| Cinta de tipo | `PokemonTypeIndexRepository` (interfaz) · `GetPokemonTypeIndexUseCase` · modelo `PokemonTypeIndex` | `PokemonTypeIndexRepositoryImpl` → remoto `/type/{nombre}` + local (caché) · mapper DTO → índice | `TypeRibbon` (componente) · el view model del listado cruza el índice con los ítems |
| Búsqueda | `PokemonSearchIndexRepository` (interfaz) · `SearchPokemonUseCase` (normalización + coincidencia) | `PokemonSearchIndexRepositoryImpl` → remoto `/pokemon?limit=100000` + local | `SearchBar` · `useDebouncedValue` · estado de búsqueda en el view model del listado |
| Tema | enum `ThemePreference` · `nextThemePreference` (orden del ciclo) | — (no se persiste, FR-210) | `ThemeProvider` (reemplaza `useTheme` basado solo en el sistema) · `ThemeToggle` con iconos propios |
| Skeleton / imágenes | — (puramente visual) | — | `Shimmer`, `ProgressiveImage`, `useSkeletonCount`, `useMinimumDuration` · `Image.prefetch` desde el view model |
| Header colapsable | — | — | `CollapsingHeader` + `useCollapsingHeader` (`Animated.event` e interpolaciones) |
| Shared transition | — | — | `SharedElementRegistry` (contexto) + capa overlay en `StackNavigator` |

### Principios SOLID aplicados

- **S (SRP):** se crean repositorios separados para tipos, búsqueda y preferencias. `PokemonRepository` no
  crece. La normalización de texto vive en el caso de uso de búsqueda, no en la vista.
- **O (OCP):** la política de caché de la 001 se **reutiliza** extrayendo la lógica genérica de
  `PokemonRepositoryImpl.resolve` a un `CachePolicy` compartido, sin modificar su comportamiento.
- **L (LSP):** toda implementación de `KeyValueStorage` (nativa o en memoria) sirve para los nuevos repositorios.
- **I (ISP):** la UI recibe casos de uso concretos y pequeños. `AppDependencies` suma
  `getTypeIndex` y `searchPokemon`.
- **D (DIP):** dominio y presentación dependen de interfaces. Solo `di/container.ts` conoce las implementaciones.

## 2. Decisiones técnicas (continúan la numeración de la 001)

### ADR-10 · Tipos del listado vía índice de tipos (no N+1)
- **Contexto:** `/pokemon?limit=20` solo trae `name` y `url`. El detalle trae los tipos, pero
  pesa ~279 KB por Pokémon (medido): ~5,6 MB por página.
- **Decisión:** construir un índice `id → tipos` desde `/type/{nombre}` (~21 KB cada uno, medido
  con `fire`), con 18 peticiones en paralelo una sola vez. Se usa el `slot` de cada entrada para
  saber el tipo principal. Se **incluyen** las formas alternativas (id > 10000), porque aparecen
  al final del listado y en la búsqueda. Como esto cambió el significado del caché, se subió
  `CACHE_CONFIG.schemaVersion` a 2, y el índice guardado por la versión anterior se descarta solo.
- **Caché:** 7 días con la misma envoltura `{schemaVersion, savedAt, data}`. Si algún tipo falla, el
  índice parcial se usa igualmente y se reintenta en el siguiente arranque.
- **Beneficio extra:** habilita los filtros por tipo en el futuro sin nuevas peticiones.

### ADR-11 · Búsqueda local sobre índice de nombres
- PokéAPI no tiene endpoint de búsqueda. Se descarga la lista completa de nombres (~1350 entradas,
  ~100 KB) y se busca en memoria: minúsculas, acentos del español quitados con un mapa propio
  (no se depende de `String.prototype.normalize` en Hermes), `includes` por nombre y coincidencia
  exacta por número. Es O(n) sobre ~1350 elementos, despreciable.
- El índice queda en memoria. Si llegó *stale* (sin red), se responde al instante y la red se
  reintenta en segundo plano como mucho una vez por minuto, en lugar de bloquear cada búsqueda.

### ADR-12 · Tema: arranque en "Sistema" + `Appearance.setColorScheme`
- `ThemeProvider` resuelve `SYSTEM | LIGHT | DARK` y **siempre arranca en `SYSTEM`** (enmienda
  de FR-210). Al no leer nada de disco, el primer render ya tiene el tema correcto y no hace
  falta esperar. La elección manual vive solo en memoria durante la sesión.
- *Antes:* la preferencia se guardaba en `KeyValueStorage` y se leía al arrancar. Se retiró por
  pedido del usuario junto con su repositorio y casos de uso, para no dejar código muerto.
- Iconos (FR-222): PNG monocromos @1x/@2x/@3x exportados de un SVG maestro
  propio y coloreados con `tintColor`. Sin `react-native-svg` (NFR-201) y
  con la misma forma en iOS y Android, cosa que los caracteres Unicode `◐ ☀ ☾` no garantizaban.
- `Appearance.setColorScheme` se llama **antes** de actualizar el estado, de modo que el render
  siguiente ya lee el esquema correcto: no hay un frame con el tema anterior.

### ADR-13 · Header colapsable en el driver nativo
- `Animated.FlatList` con `Animated.event(..., { useNativeDriver: true })`. Solo se interpolan
  `transform` y `opacity`, porque la altura no puede animarse en el driver nativo.
- **iOS** usa `contentInset`/`contentOffset` para que el pull-to-refresh aparezca bajo el header;
  **Android** usa `paddingTop` + `progressViewOffset`. El offset se normaliza a "0 = arriba" en ambos.
- La barra de búsqueda deja sitio al ícono sin animar el ancho: el fondo se encoge con `scaleX`
  anclado a la derecha y el contenido se desplaza con `translateX`.
- Un scrim estático del color del header tapa el título mientras sube bajo la barra de estado.
  Se ordena solo con `zIndex`, porque la `elevation` de Android dibujaba una franja.
- Al buscar, un valor animado suma la distancia de colapso: el header pasa a compacto y los
  resultados reservan solo esa altura.

### ADR-14 · Shared transition en TypeScript con animación en el driver nativo
- RN core no la trae y `sharedTransitionTag` es de Reanimated (externa). Se evaluó una versión
  nativa (TurboModule Kotlin/Swift con snapshots de vistas). Se descartó porque añade APIs
  internas de Fabric en dos plataformas sin mejorar la fluidez: la animación ya corre en el
  hilo de UI (decisión tomada con el usuario).
- Funcionamiento:
  1. La tarjeta (origen) y el hero del detalle (destino) se registran por clave en
     `SharedElementRegistry`. La tarjeta **tocada** se marca como activa, así el vuelo sale de
     ella y vuelve a ella aunque la misma clave esté montada dos veces (listado y búsqueda).
  2. Al navegar, el origen se mide con `measureInWindow`. El destino se mide cuando reporta su
     primer `onLayout`; el hero nace oculto para no aparecer bajo el vuelo.
  3. `SharedElementProvider` pinta un clon de la imagen en una capa overlay sobre todas las
     pantallas y lo anima (traslación del centro + escala) en el driver nativo mientras la ruta
     hace un fundido cruzado con la **misma duración y curva** (fast-out-slow-in, 340 ms).
  4. La vuelta es el vuelo inverso. Solo ocurre si la tarjeta está montada y completamente visible
     **bajo el header** del listado (la pantalla declara ese límite); si no, hay un fundido simple.
  5. Los originales se ocultan cuando el clon ya está en pantalla, nunca antes, para que no
     "parpadeen" mientras el overlay se monta.
- Lecciones verificadas en dispositivo:
  - Cada vuelo usa un `Animated.Value` **nuevo**. Reutilizar uno cuyo nodo nativo pertenecía a
    un overlay desmontado dejaba el nuevo overlay congelado hasta el final (se detectó en la
    vuelta grabando la pantalla en cámara lenta).
  - El vuelo arranca en el `onLoad` de la imagen del overlay (vista montada y pintada), con un
    respaldo de 100 ms para que un vuelo nunca bloquee la navegación.
- El gesto de borde de iOS siempre desliza la página (el dedo la arrastra). Con "Reducir
  movimiento" no hay vuelo y todas las transiciones son fundidos.
- Organización (SOLID): el módulo vive en `presentation/sharedElement/`, fuera de `navigation/`,
  así la tarjeta no depende del navigator (DIP). La orquestación de vuelos está en el hook
  `useSharedFlights`; el navigator solo gestiona la pila, los gestos y las transiciones (SRP).
  Cada ruta se renderiza en una escena memoizada para no re-renderizar el listado al empezar
  una transición.
- En el detalle, el aviso offline va debajo del hero, así nunca lo desplaza durante el vuelo.

### ADR-15 · Skeleton sin parpadeo y "Reducir movimiento" centralizado
- `useMinimumDuration(loading, { delayMs: 150, minVisibleMs: 300 })` es un hook testeable con
  fake timers. El shimmer es una `View` translúcida inclinada que se desplaza con `translateX`
  (no hay `LinearGradient` en core).
- "Reducir movimiento" se lee **una sola vez** en `ReduceMotionProvider` (en la raíz), en vez de
  una llamada nativa y un listener por componente animado.
- El colapso del header sigue al dedo (movimiento directo del usuario), así que no se desactiva
  con "Reducir movimiento", que apunta a animaciones automáticas. Sí se respeta en la animación
  automática de colapso al empezar a buscar.
- Precarga y "cargar más" comparten la misma petición en curso por página, así que un *fling*
  nunca duplica llamadas.

### ADR-16 · Botón volver arriba (Fase F) y retiro del pull-to-refresh propio
- **Pull-to-refresh (historial):** se implementó un indicador propio (mini Pokéball y anillo). En
  iOS usaba el `RefreshControl` con `tintColor` transparente y leía el tirón del `contentOffset`
  negativo. En Android, como `SwipeRefreshLayout` no informa cuánto se tira, usaba un componente
  nativo propio (`PullRefreshLayout`, padre de *nested scroll* en Kotlin, declarado con codegen).
  *Enmienda (decisión del usuario):* se retiró todo. El listado vuelve al `RefreshControl` nativo
  con `tintColor`/`colors` = `primary` y `progressViewOffset` bajo el header. Se eliminaron el
  indicador, `ProgressRing`, `PokeballOrb`, `assets/orb`, el componente nativo y su spec, y
  `codegenConfig.type` vuelve a `modules`.
- **Volver arriba:** solo JS. La visibilidad sale de un *listener* del mismo `Animated.Value` del
  scroll (el estado solo cambia al cruzar el umbral). *Enmienda:* por decisión del usuario el
  botón pasó a ser un `CircleButton` de marca (variante `brand`: rojo en tema claro, blanco en oscuro, según `isDark` ya resuelto por el `ThemeProvider`; sombra con `boxShadow`) con un `Chevron` dibujado
  con vistas. Se retiraron el anillo de profundidad y su medición (tamaño del contenido y scroll
  máximo), que ya no tenían uso.
- **Sin Rive:** los prototipos se hicieron en Rive, pero la app no usa su runtime (es una
  dependencia externa, constitución §2) ni ninguna parte de esos diseños.


### ADR-17 · Listado por especies y resultados sin `contentInset`
- **Especies (FR-223):** `/pokemon` tiene `count` 1351 porque suma 326 formas alternativas
  (#10001+) a las 1025 especies, y la app mostraba "de 1351" aunque el #1351 no existe. El
  listado pagina sobre `/pokemon-species`: mismo formato de respuesta, `count` real de la
  Pokédex y fin natural en el #1025, sin escribir 1025 en el código. Los ids de especie coinciden
  con el de su forma por defecto, así que detalle, imagen y cinta (por id) siguen igual.
  `CACHE_CONFIG.schemaVersion` sube a 3 para descartar páginas guardadas con el total viejo.
- **Resultados (FR-224):** en iOS las listas usaban `contentInset` y dependían de que su
  `contentOffset` inicial fuera `-headerHeight`. Si iOS ajusta el offset a 0 (pasó en dispositivo con
  resultados más cortos que la pantalla), la primera fila queda bajo el header. Primero se quitó el
  inset solo en la búsqueda; después, al detectarse que `UIRefreshControl` también reescribe
  `contentInset.top`, se generalizó: **ninguna lista usa `contentInset`**. Ambas plataformas reservan
  el espacio del header con relleno superior y el tope es siempre el offset 0 (`useHeaderScroll`,
  `useScrollToTop`). En iOS el spinner nativo es transparente y se muestra un indicador propio bajo
  el header mientras refresca.

## 3. Riesgos

| Riesgo | Mitigación |
|---|---|
| El header colapsable y el `RefreshControl` chocan en iOS (el rebote negativo mueve el header) | Limitar el rango de interpolación con `extrapolate: 'clamp'` y probar en los dos simuladores |
| El índice de tipos incluye tipos nuevos (`stellar`, `unknown`, `shadow`) | Se ignoran los tipos sin Pokémon; ya existe `PokemonType.UNKNOWN` como fallback |
| La shared transition desincroniza la medición en rotación o con el gesto de iOS | Última fase, con fallback siempre disponible y pruebas en ambos simuladores |
| El alcance crece frente al plazo de 2 días del PDF | Las fases son entregables por separado; la shared transition puede quedar documentada como mejora futura |
