# AGENTS.md — Flujo de trabajo agéntico

Guía para agentes de IA (y humanos) que trabajen en este repositorio. Combina
**Spec-Driven Development (SDD)** con el patrón agéntico
**Orchestrator–Workers + Evaluator–Optimizer**.

## Por qué este patrón

| Patrón | Uso aquí | Por qué |
|--------|----------|---------|
| **Orchestrator–Workers** | El orquestador lee `specs/<feature>/tasks.md` y reparte las tareas `[P]` (independientes) entre workers por capa: dominio, datos, nativo y UI | Las capas de Clean Architecture tienen contratos (interfaces) definidos en la spec, así que se pueden construir en paralelo sin pisarse |
| **Evaluator–Optimizer** | Un evaluador independiente verifica cada entrega contra los criterios de aceptación y las compuertas objetivas. Si falla, devuelve hallazgos y el worker corrige | Evita que el agente que escribió el código se autoapruebe, y las compuertas son objetivas, no opiniones |

Se descartaron alternativas más "libres" (enjambres, agentes conversando entre sí)
porque en un código con capas interdependientes aumentan la inconsistencia sin
aportar calidad.

## Ciclo SDD

```
constitution.md ──► spec.md ──► plan.md ──► tasks.md ──► implement ──► evaluate
   (principios)     (qué/por qué)  (cómo, ADR)  (trazables)   (workers)    (evaluator)
                                                                  ▲            │
                                                                  └── fixes ◄──┘
```

1. **Specify.** Cada requisito tiene un ID (`FR-*`, `BR-*`, `NFR-*`) y un criterio de aceptación verificable.
2. **Plan.** Las decisiones técnicas se registran como ADR en `plan.md`.
3. **Tasks.** Cada tarea referencia los IDs que satisface; `[P]` marca las paralelizables.
4. **Implement.** Cada worker toca solo su capa y respeta las interfaces existentes.
5. **Evaluate.** Se ejecutan las compuertas y se revisa la trazabilidad spec → código → prueba.

## Compuertas del evaluador (deben pasar todas)

```sh
npm run validate                       # tsc + eslint + prettier + jest
cd android && ./gradlew assembleDebug  # Kotlin + codegen
cd ios && xcodebuild -workspace pokeapi.xcworkspace -scheme pokeapi \
  -sdk iphonesimulator build           # Swift + ObjC++ + codegen
```

## Reglas para agentes

- No agregues dependencias a `dependencies` (constitución §2). Si algo falta, constrúyelo detrás de una interfaz.
- Respeta la dirección de dependencias: `presentation → domain ← data`. El dominio no importa React ni React Native.
- Usa sufijos de archivo: `.model.ts`, `.interface.ts`, `.enum.ts`, `.types.ts`, `.dto.ts`.
- Todo cambio de comportamiento lleva prueba. Todo requisito nuevo entra primero en `spec.md`.
- Los módulos nativos se declaran en `src/native/specs` (codegen). La lógica va en Kotlin/Swift y el wrapper ObjC++ solo hace de puente.
