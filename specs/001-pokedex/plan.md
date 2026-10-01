# Plan técnico 001 — Pokédex

> Fase **Plan** (SDD). Cómo se satisface `spec.md` respetando `constitution.md`.

## 1. Arquitectura

Clean Architecture en tres capas + núcleo transversal + composition root:

```
┌──────────────────────── presentation ────────────────────────┐
│ screens (View)  ←  view-model hooks (useReducer)  ←  DI ctx  │
│ components · navigation (stack propio) · theme              │
└──────────────────────────────┬───────────────────────────────┘
                               │ usa
┌──────────────────────── domain ──────────────────────────────┐
│ models · enums · repositories (interfaces) · use cases       │  ← sin React / RN / red
└──────────────────────────────▲───────────────────────────────┘
                               │ implementa
┌──────────────────────── data ────────────────────────────────┐
│ PokemonRepositoryImpl (política de caché)                    │
│   ├─ PokeApiRemoteDataSource  → HttpClient (fetch)           │
│   └─ PokemonLocalDataSource   → KeyValueStorage              │
│ dto · mappers                                                │
└──────────────────────────────────────────────────────────────┘
core: errors (AppError, ErrorCode) · http · storage · config
native (TurboModules): KeyValueStore (Kotlin/Swift) · SafeArea (Kotlin/Swift)
di: container.ts (composition root) + DependenciesProvider (React context)
```

**Flujo de una petición:** `PokemonListScreen` → `usePokemonListViewModel` →
`GetPokemonPageUseCase` → `PokemonRepository` (interfaz) → `PokemonRepositoryImpl` →
caché local / PokéAPI → mapper → modelo de dominio → reducer → vista.

### Estructura de carpetas

```
src/
├── core/            # transversal, sin conocimiento de Pokémon
│   ├── config/      # constantes (URL base, TTL, tamaño de página)
│   ├── errors/      # AppError, ErrorCode.enum, errorMessages
│   ├── http/        # HttpClient.interface + FetchHttpClient
│   └── storage/     # KeyValueStorage.interface + adaptador nativo + in-memory
├── domain/
│   ├── enums/       # PokemonType.enum, StatName.enum, DataOrigin.enum
│   ├── models/      # Pokemon.model, Page.model, Resource.model
│   ├── repositories/# PokemonRepository.interface
│   └── usecases/    # GetPokemonPageUseCase, GetPokemonDetailUseCase
├── data/
│   ├── datasources/ # remote/ y local/ (interfaz + implementación)
│   ├── dto/         # PokeApi.dto (contrato JSON de la API)
│   ├── mappers/     # DTO → modelo de dominio
│   └── repositories/# PokemonRepositoryImpl
├── di/              # composition root + contexto React
├── native/          # specs de codegen de los TurboModules
└── presentation/
    ├── assets/      # imágenes empaquetadas (capas del splash exportadas de Blender)
    ├── components/  # UI reutilizable y "tonta"
    ├── hooks/       # hooks transversales (safe area)
    ├── navigation/  # stack navigator propio y tipos de rutas
    ├── screens/     # una carpeta por pantalla: Screen + ViewModel + reducer + types
    ├── theme/       # tokens de color, espaciado, tipografía, colores por tipo
    └── utils/       # formateadores de presentación
```

## 2. Decisiones técnicas (ADR)

### ADR-01 · Persistencia con TurboModule nativo propio (Kotlin + Swift)
- **Contexto:** la restricción de cero librerías excluye AsyncStorage/MMKV, y React Native
  ya no incluye un almacenamiento persistente multiplataforma en su núcleo (`Settings` es solo iOS).
- **Decisión:** módulo `NativeKeyValueStore` con codegen (New Architecture). Guarda un archivo
  por clave (nombre codificado en Base64 URL-safe) en `filesDir` (Android) y en
  `Application Support` (iOS). La E/S corre en un hilo de fondo y la escritura es atómica
  (archivo temporal + rename en Android y `.atomic` en iOS).
- **Por qué archivos y no SharedPreferences/UserDefaults:** esos almacenes se cargan completos
  en memoria y no están pensados para blobs JSON grandes. Con archivos cada lectura es O(1)
  por clave y el caché puede crecer sin penalizar el arranque.
- **Aislamiento:** la app solo ve la interfaz `KeyValueStorage`. Cambiar a SQLite o MMKV
  significaría cambiar un adaptador (OCP/DIP). En Jest se inyecta `InMemoryKeyValueStorage`.

### ADR-02 · Estrategia de caché: cache-first con TTL y respaldo "stale"
- Entradas envueltas en `{ schemaVersion, savedAt, data }`. Si cambia `schemaVersion`, la
  entrada se descarta, lo que protege contra datos incompatibles tras una actualización.
- TTL: listado 24 h, detalle 7 días. Los datos de Pokémon son prácticamente estáticos.
- Orden: caché vigente → red (y se guarda) → si la red falla y hay caché vencido, se devuelve
  con `origin = STALE_CACHE` y la UI muestra un aviso de "sin conexión".
- Pull-to-refresh omite el caché (`forceRefresh`), pero conserva el respaldo stale.
- Las imágenes usan el caché nativo del componente `Image` (Fresco / NSURLCache), así que las
  ya vistas funcionan offline.

### ADR-03 · Navegación: stack navigator propio
- Rutas tipadas con un *param list* (`RootStackParamList`) y una unión discriminada, de modo
  que `navigate('PokemonDetail', params)` se valida en compilación.
- Las pantallas previas permanecen montadas, así que el listado conserva su scroll y su estado.
- Transición con `Animated` (driver nativo), `BackHandler` en Android y gesto de borde
  (`PanResponder`) en iOS.

### ADR-04 · Estado: MVVM con `useReducer` por pantalla
- Cada pantalla tiene un *view model* (hook) que orquesta casos de uso y un reducer puro,
  testeable sin React, con estados explícitos `loading | success | error | empty`.
- No hace falta estado global: el caché vive en la capa de datos, no en la UI.

### ADR-05 · Inyección de dependencias por composition root + Context
- `createContainer()` construye el grafo una sola vez. `DependenciesProvider` lo expone y
  los tests inyectan fakes pasando un contenedor alternativo. No se usan decoradores ni *service locator*.

### ADR-06 · Imagen del listado derivada del ID
- `/pokemon?limit=20` devuelve solo `name` y `url`. La imagen oficial se construye con el ID
  extraído de la URL, lo que evita 20 peticiones extra (N+1). Trade-off: se depende de la
  convención de URLs del repositorio de sprites de PokéAPI (estable desde hace años).

### ADR-07 · Safe area nativa
- `SafeAreaView` está deprecado en RN 0.87 y Android usa edge-to-edge. El TurboModule
  `NativeSafeArea` devuelve los *insets* reales (WindowInsetsCompat / `UIWindow.safeAreaInsets`),
  que se vuelven a consultar al rotar.

### ADR-08 · Errores centralizados
- Toda excepción se normaliza a `AppError` con un `ErrorCode` (`NETWORK`, `TIMEOUT`,
  `NOT_FOUND`, `SERVER`, `PARSE`, `STORAGE`, `UNKNOWN`). Un solo mapa traduce códigos a
  mensajes amigables e indica si se puede reintentar.

### ADR-09 · Splash animado sin librerías
- Lottie, Reanimated y `react-native-bootsplash` son dependencias externas (NFR-01). La escena
  se modela y anima en Blender y se exporta como capas PNG (mitades,
  núcleo, botón y sus estados de brillo). `AnimatedSplash` las mueve con `Animated` y un único
  valor de tiempo (fotogramas a 30 fps) que se interpola por propiedad; todo corre con
  `useNativeDriver`, así que la carga de datos en JS no afecta la fluidez.
- El splash nativo es solo el color de fondo (`LaunchScreen.storyboard`, `windowBackground` y
  SplashScreen API de Android 12+ con icono transparente). Como la animación empieza con la
  pantalla vacía y la esfera cae desde arriba, no hay que alinear posiciones entre nativo y JS.
- Se monta encima del navegador: el listado pide datos desde el primer instante y la animación
  cubre el tiempo de red. El destello final usa el color de fondo del tema y el overlay se
  desvanece. Trade-off: 3,3 s en cada arranque en frío; la apertura es una aproximación 2D del
  giro 3D del render.

## 3. Trade-offs y mejoras futuras
- Sin revalidación en segundo plano (stale-while-revalidate): se eligió cache-first por simplicidad.
- Sin política de expulsión del caché en disco. Tamaño estimado < 2 MB para cientos de Pokémon,
  y se podría añadir un LRU en el adaptador.
- Sin detección activa de conectividad (NetInfo es externo): la desconexión se infiere del error de `fetch`.
- Sin pruebas E2E (Detox/Maestro serían dependencias externas).
- Nombres de habilidades en inglés (traducirlos requiere una llamada extra por habilidad).
