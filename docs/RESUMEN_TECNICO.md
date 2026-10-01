# Resumen técnico: Pokédex React Native

> Documento de análisis de la solución al reto técnico *React Native: Pokedex Challenge*.
> Explica la metodología, las decisiones, lo que se verificó y los puntos a tener en cuenta
> antes de entregar. Estado al **30/09/2026**.

---

## 1. Estado actual (verificado)

| Compuerta | Resultado |
|---|---|
| `tsc --noEmit` (strict) | ✅ sin errores |
| ESLint + Prettier | ✅ sin errores ni warnings |
| Jest | ✅ **177 pruebas, 27 suites**, cobertura **~92 %** de líneas |
| Build Android (Kotlin + codegen) | ✅ `assembleDebug` y `assembleRelease` |
| Build iOS (Swift + ObjC++ + codegen) | ✅ `xcodebuild` simulador |
| Ejecución real | ✅ iOS 27 (simulador) y Android (emulador) contra PokéAPI real |
| Offline real | ✅ build release en modo avión (Android) |
| Dependencias de runtime | ✅ solo `react` y `react-native` |

La app cumple todos los puntos del PDF: los obligatorios (§2–§4, §6–§7) y todos los bonus (§5).

---

## 2. Metodología recomendada

### 2.1 Spec-Driven Development (SDD)

Interpreté "SSD" como **SDD (Spec-Driven Development)**: la especificación es la fuente de
verdad y el código se deriva de ella. Hay cinco fases con un artefacto versionado cada una:

| Fase | Artefacto | Qué contiene |
|---|---|---|
| Constitution | `specs/constitution.md` | 7 principios no negociables (cero dependencias, Clean Architecture, tipado estricto…) |
| Specify | `specs/001-pokedex/spec.md` | Cada punto del PDF convertido en requisito con ID (`FR`, `BR`, `NFR`) y **criterio de aceptación verificable** |
| Plan | `specs/001-pokedex/plan.md` | Arquitectura y decisiones técnicas en formato ADR (ADR-01…09) |
| Tasks | `specs/001-pokedex/tasks.md` | Tareas trazables a requisitos; `[P]` marca las paralelizables |
| Implement / Evaluate | código + pruebas | Cada requisito tiene implementación y prueba |

**Por qué SDD para este reto:** el PDF evalúa sobre todo *criterio técnico,
documentación y trazabilidad*. Con SDD el revisor puede ir de cualquier requisito del PDF
a su decisión técnica, al código y a la prueba que lo demuestra.

### 2.2 Patrón agéntico: Orchestrator–Workers + Evaluator–Optimizer

| Patrón | Rol en el proyecto |
|---|---|
| **Orchestrator–Workers** | El orquestador lee `tasks.md` y reparte las tareas independientes por capa (dominio, datos, nativo, UI). Las interfaces definidas en el plan permiten construir las capas en paralelo sin choques |
| **Evaluator–Optimizer** | Un agente evaluador **independiente** (sin ver las conclusiones del implementador) revisa el código contra la spec y las compuertas objetivas. Sus hallazgos vuelven al implementador, que corrige, y se repite la evaluación |

**Por qué este y no otro:** en una arquitectura por capas con contratos, los esquemas
multi-agente "libres" (enjambres, agentes conversando entre sí) generan inconsistencias. Lo que más
calidad aporta es la **revisión independiente con compuertas objetivas**: evita que quien
escribe el código se autoapruebe. Está documentado en `AGENTS.md`.

### 2.3 El ciclo aplicado de verdad

El evaluador revisó la entrega y encontró **0 críticos, 3 mayores y 7 menores**. Todos se
validaron contra el código y **todos se corrigieron**, cada uno con su prueba de regresión:

| # | Severidad | Hallazgo | Corrección |
|---|---|---|---|
| 1 | Mayor | Pull-to-refresh sin red reemplazaba todas las páginas cargadas por la página 0 del caché | Nueva política `allowStaleFallback: false` en el refresh: se conservan los datos y se muestra un aviso |
| 2 | Mayor | Si un refresh interrumpía un "cargar más", el spinner quedaba activo para siempre y la paginación moría | `REFRESH_START` limpia el estado de "cargar más" |
| 3 | Mayor | En iOS, la franja del gesto de regreso bloqueaba la mitad del botón "Volver" y el scroll | El gesto ahora se captura solo cuando hay arrastre horizontal desde el borde, así que los taps pasan |
| 4 | Menor | `validate` fallaba después de generar cobertura | `.prettierignore` / `.eslintignore` |
| 5 | Menor | El aviso offline quedaba pegado y decía "sin conexión" también ante errores 5xx | El aviso refleja la última carga y tiene un texto preciso |
| 6 | Menor | Los insets podían llegar en cero sin avisar | Los módulos nativos rechazan si no hay ventana; JS usa el fallback, reintenta y vuelve a medir al volver a primer plano |
| 7 | Menor | El caché de iOS se respaldaba en iCloud | Directorio marcado `isExcludedFromBackup` |
| 8 | Menor | 6 colores por debajo del contraste WCAG AA | Paleta ajustada: todos ≥ 4,5:1 (calculado) |
| 9 | Menor | VoiceOver no tenía gesto de escape para regresar | `onAccessibilityEscape` en la pantalla superior |
| 10 | Menor | Faltaban pruebas de view models y navegación | Pruebas nuevas (refresh offline, botón atrás, safe area, reducer de detalle) |

---

## 3. La restricción clave del PDF: "sin librerías externas"

El punto 7 prohíbe cualquier librería externa. Eso deja fuera **React Navigation, AsyncStorage,
safe-area-context, Lottie y Reanimated**, y el template de React Native incluso traía dos que
se eliminaron. Cada hueco se resolvió con lo que ofrece la propia plataforma:

| Necesidad | Solución | Detalle |
|---|---|---|
| Persistencia | **TurboModule propio `NativeKeyValueStore`** en Kotlin y Swift | Un archivo por clave, E/S en hilo de fondo serializado y escritura atómica. Queda detrás de la interfaz `KeyValueStorage`, así que se podría cambiar por SQLite sin tocar el resto |
| Safe area | **TurboModule propio `NativeSafeArea`** en Kotlin y Swift | `SafeAreaView` está deprecado en RN 0.87 y Android es edge-to-edge |
| Navegación | **Stack navigator propio**, tipado | Transiciones en el driver nativo, botón atrás de Android, gesto de borde en iOS; el listado conserva el scroll |
| Splash animado | **Capas exportadas desde Blender** animadas con `Animated` | Sin Lottie; respeta "Reducir movimiento" |

Justificación ante el revisor: un TurboModule **es** infraestructura de React Native (codegen y
New Architecture), no una librería de terceros. Además demuestra dominio de Kotlin y Swift.

---

## 4. Arquitectura en breve

```
presentation  → pantallas, view models (useReducer), componentes, navegación, tema
      │ usa casos de uso (inyectados por Context)
domain        → modelos, enums, interfaces de repositorio, casos de uso   (sin React/RN)
      ▲ implementa
data          → repositorio (política de caché), fuentes remota/local, DTOs, mappers
core / native → errores centralizados, HTTP, almacenamiento · TurboModules Kotlin/Swift
```

- **Clean Architecture + SOLID + DI:** el composition root `createAppDependencies()` es el único lugar
  que conoce las implementaciones concretas; los tests inyectan fakes.
- **Caché:** cache-first con TTL (lista 24 h, detalle 7 días), versión de esquema y respaldo
  "stale" cuando no hay red.
- **Tipos identificables:** sufijos `.model`, `.interface`, `.enum`, `.types`, `.dto`.

---

## 5. Qué se verificó ejecutando la app

| Escenario | Plataforma | Resultado |
|---|---|---|
| Listado de 20 con nombre, número e imagen | iOS y Android | ✅ |
| Paginación incremental | Android | ✅ (40 de 1025 al hacer scroll) |
| Detalle completo (tipos, habilidades con la oculta, stats, peso, altura, exp. base) | Android | ✅ |
| Botón físico atrás | Android | ✅ |
| Reinicio en frío en modo avión → listado y detalle desde disco | Android (release) | ✅ |
| Pokémon nunca abierto sin red → "Sin conexión" + Reintentar | Android (release) | ✅ |
| Safe area real (Dynamic Island, barra de gestos) | iOS y Android | ✅ |
| Archivos de caché en `filesDir/kv-store` | Android | ✅ (inspeccionado con `adb run-as`) |

Evidencias en `docs/screenshots/`, enlazadas en el README.

---

## 6. Cosas que debes saber antes de entregar

1. **Se modificó el arranque de iOS.** El template original de React Native **se cerraba al iniciar
   en iOS 27**, que exige el ciclo de vida UIScene. Se agregó `SceneDelegate.swift` y el manifiesto
   de escenas en `Info.plist`. No era un defecto de nuestro código, pero sin ese cambio la app no abría.
2. **El CI no se ha ejecutado todavía.** `.github/workflows/ci.yml` está configurado (tsc, lint,
   formato, pruebas, build Android y build iOS), pero no ha corrido en GitHub. El job de iOS usa
   `macos-latest` y podría necesitar ajustar la versión de Xcode del runner.
3. **No hay commits.** Todo está en el working tree sobre el commit inicial. Conviene commitear en
   una rama con mensajes por fase.
4. **El PDF de requisitos no se versiona.** Se renombró a `required.pdf` y está en `.gitignore`:
   suele ser material confidencial del proceso de selección.
5. **Falta el entregable principal del §6: el repositorio público.** Hay que crearlo y hacer push.
6. **Probar offline requiere un build release en Android.** En debug el bundle viene de Metro, y el
   modo avión corta esa conexión (no es un fallo de la app).
7. **Pruebas y animaciones.** El preset de Jest no completa las animaciones con driver nativo, así que
   las pruebas de integración las terminan en el siguiente tick (está documentado en el test).
8. **Trade-offs aceptados** (detallados en `plan.md` y en el README):
   - Sin revalidación en segundo plano (stale-while-revalidate).
   - Sin LRU en el caché de disco.
   - Conectividad inferida del error de `fetch`, porque NetInfo es externo.
   - Sin E2E, porque Detox y Maestro son externos.
   - Habilidades en inglés.
   - El splash dura 3,6 s en cada arranque en frío.

---

## 7. Cómo incorporar funcionalidades nuevas (fuera del PDF)

Para no romper la trazabilidad, cada funcionalidad nueva entra por el mismo ciclo SDD:

1. **Nueva spec:** `specs/002-<feature>/spec.md` con requisitos `FR-2xx` y criterios de aceptación.
2. **Plan:** ADR nuevos si hay decisiones técnicas (siempre respetando la constitución: cero dependencias).
3. **Tareas** con `[P]` para las paralelizables.
4. **Implementación + evaluación** con las mismas compuertas: `npm run validate` y los builds de Android e iOS.
5. Actualizar el README (funcionalidades, trade-offs) y las evidencias.

Si alguna funcionalidad choca con la constitución (por ejemplo, necesitar una librería externa),
se discute y se documenta explícitamente antes de implementarla.
