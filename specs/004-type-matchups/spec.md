# Spec 004: Debilidades y resistencias

> Fase **Specify** (SDD). Muestra en el detalle cuánto daño recibe cada Pokémon de cada tipo,
> con los datos de `/type/{nombre}` que la app ya descarga para el índice de tipos (FR-207).
> Se rige por `specs/constitution.md`: **cero dependencias externas**, Clean Architecture y SOLID.

## Historias de usuario

- **HU-14.** Como usuario quiero saber contra qué tipos es débil o resistente un Pokémon, sin calcularlo yo.

## Requisitos funcionales

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| FR-401 | Sección en el detalle | El detalle muestra la sección "Debilidades y resistencias" con hasta tres grupos: **Débil contra** (×4, ×2), **Resistente a** (×½, ×¼) e **Inmune a** (×0). Los grupos vacíos no se muestran |
| FR-402 | Cálculo con doble tipo | El multiplicador de cada tipo atacante es el producto de los multiplicadores contra cada tipo del Pokémon (Bulbasaur, Planta/Veneno: Fuego ×2, Planta ×¼, Bicho ×1). Los ×1 no se muestran |
| FR-403 | Orden | Debilidades de mayor a menor (×4 primero); resistencias de menor a mayor (×¼ primero); a igual multiplicador, en el orden de los tipos de la fila de filtros |
| FR-404 | Chip de tipo | Cada entrada es una píldora con el círculo de color e ícono del tipo (los de la spec 003), su nombre y el multiplicador. ×4 y ×¼ se destacan con un borde del color del tipo |
| FR-405 | Sin peticiones nuevas | Las relaciones de daño (`damage_relations`) salen de las mismas 18 respuestas de `/type/{nombre}` del índice de tipos y se cachean con él (7 días) |
| FR-406 | Tolerante a fallos | Si la tabla de tipos no está disponible, o le falta alguno de los tipos del Pokémon (índice parcial), la sección no se muestra y el detalle funciona igual. El detalle nunca espera a la tabla |

## Requisitos no funcionales

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| NFR-401 | Cero dependencias | Solo `react` y `react-native` |
| NFR-402 | Clean Architecture | El cálculo vive en el dominio (`defensiveMatchups`, puro). La tabla entra por la interfaz `PokemonTypeChartRepository` (ISP: separada del índice), implementada en `data` |
| NFR-403 | Accesibilidad | Cada chip se anuncia con el tipo y el efecto en palabras ("Fuego, doble de daño") |
| NFR-404 | Pruebas | Dominio (doble tipo, inmunidad, tabla incompleta), mapper, repositorio, formato de multiplicadores e integración en el detalle |
