# Plan técnico 005: Cadena evolutiva

## 1. Encaje en Clean Architecture

| Capa | Cambio |
|---|---|
| Domain | Enum `EvolutionTrigger`. Modelos `EvolutionChain`, `EvolutionNode`, `EvolutionCondition`. `PokemonDetail.speciesId`. Interfaz `PokemonEvolutionRepository` y `GetEvolutionChainUseCase` |
| Data | DTOs de especie y cadena. `evolution.mapper` (árbol + condición por defecto). `PokeApiEvolutionRemoteDataSource`, `EvolutionStorageDataSource` (una entrada por miembro) y `PokemonEvolutionRepositoryImpl` con `resolveWithCache` |
| DI | `getEvolutionChain` en `AppDependencies` |
| Presentation | `useEvolutionChain`, `evolutionText` (condición → partes visuales + texto hablado), `evolutionLayout` (lineal / ramas / sin evolución, puro) y `EvolutionChainSection` |

## 2. Decisiones técnicas

### ADR-19 · Cadena guardada bajo cada miembro
- La API se consulta por especie, pero la respuesta es de toda la cadena. Al guardarla se escribe una
  entrada por miembro (`pokedex:evolution:{especie}`), así cualquier miembro la encuentra sin pedir
  primero su especie. Una cadena tiene a lo sumo 9 miembros (Eevee), así que el costo es despreciable.

### ADR-20 · Layout como función pura
- `evolutionLayout(chain)` decide entre `none`, `linear` y `branched` (prefijo lineal + tarjetas en orden
  de recorrido con su padre). Se prueba sin renderizar y la vista solo dibuja.

### ADR-21 · Condiciones como datos, texto en presentación
- El dominio guarda la condición cruda (nivel, objeto, amistad, hora, tipo de movimiento, sexo). El texto
  en español y los íconos se arman en presentación, que es donde viven las traducciones (como `TYPE_APPEARANCE`).

### ADR-22 · Esquema de caché v5
- `PokemonDetail` suma `speciesId`. Un detalle guardado antes no lo tiene y la cadena no sabría qué
  especie pedir, así que se sube `CACHE_CONFIG.schemaVersion` a 5 y los datos anteriores se descartan solos.
