# Constitución del proyecto

Principios no negociables que gobiernan toda spec, plan y tarea de este repositorio
(Spec-Driven Development). Si una decisión contradice un principio, gana el principio
o se enmienda este documento de forma explícita.

1. **Spec primero.** Ningún código se escribe sin un requisito trazable (`FR-*`, `NFR-*`)
   en `specs/<feature>/spec.md` con criterio de aceptación verificable.
2. **Cero dependencias externas en runtime.** Solo `react`, `react-native` y TypeScript.
   Lo que la plataforma no ofrece se construye: en TypeScript o como TurboModule nativo
   (Kotlin / Swift) usando la infraestructura que provee React Native.
3. **Clean Architecture.** Las dependencias apuntan hacia el dominio:
   `presentation → domain ← data`. El dominio no importa nada de React, React Native ni red.
4. **SOLID + inyección de dependencias.** Las capas dependen de interfaces; las
   implementaciones concretas se ensamblan en un único *composition root* (`src/di`).
5. **Tipado estricto.** `strict: true`, sin `any`. Modelos, interfaces, enums, types y DTOs
   se identifican por sufijo de archivo (`.model.ts`, `.interface.ts`, `.enum.ts`,
   `.types.ts`, `.dto.ts`).
6. **Calidad verificable.** Toda entrega pasa las compuertas: `tsc`, `eslint`, `jest` y el build
   nativo en ambas plataformas.
7. **Claridad sobre complejidad.** Se prefiere la solución más simple que cumple la spec.
   Todo trade-off queda documentado en `plan.md`.
