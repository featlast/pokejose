# Spec 006: Favoritos

> Fase **Specify** (SDD). Permite guardar Pokémon como favoritos y verlos con un filtro.
> Se rige por `specs/constitution.md`: **cero dependencias externas**, Clean Architecture y SOLID.
> Diseño aprobado por el usuario sobre una maqueta interactiva en Pixel 10 Pro (corazón-Pokéball,
> más recientes primero, botón siempre visible en las tarjetas).

## Historias de usuario

- **HU-16.** Como usuario quiero guardar mis Pokémon favoritos y encontrarlos rápido, incluso sin conexión.

## Requisitos funcionales

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| FR-601 | Ícono corazón-Pokéball | El ícono de favorito es un corazón con la costura y el botón central de la Pokéball, en la familia de los íconos de tema. Variantes: contorno (sin guardar), rojo y blanco (guardado), y en blanco sobre el header del detalle (contorno / silueta con la costura recortada) |
| FR-602 | Botón en la tarjeta | Cada tarjeta del listado y de los resultados tiene un botón redondo junto a la imagen, tocando por fuera el borde inferior derecho de su círculo (*ajuste tras probar en dispositivo:* nunca tapa al Pokémon), que agrega o quita el favorito sin abrir el detalle |
| FR-603 | Botón en el detalle | El header del detalle tiene el corazón en blanco a la derecha del nombre |
| FR-604 | Animación de captura | Al guardar, el corazón crece, se sacude tres veces como una Pokéball y suelta chispas; al quitar, se encoge y vuelve. Con "Reducir movimiento" el cambio es inmediato. Corre en el driver nativo |
| FR-605 | Aviso con deshacer | Al guardar aparece "X se guardó en favoritos"; al quitar, "Se quitó X de favoritos" con **Deshacer**, que lo devuelve a su posición. El aviso se oculta solo y se anuncia a lectores de pantalla |
| FR-606 | Filtro Favoritos | En la fila de filtros, justo después de **Todos**, un círculo **Favoritos** con el número de favoritos. Muestra solo los favoritos, **los más recientes primero**, se combina con la búsqueda y deja el header en rojo |
| FR-607 | Vacío | Sin favoritos, el filtro muestra "Aún no tienes favoritos" y cómo agregar el primero. Con búsqueda sin coincidencias: "No encontramos favoritos para “X”." |
| FR-608 | Persistencia offline | Los favoritos (número, nombre e imagen) se guardan en el almacenamiento nativo (`NativeKeyValueStore`), sobreviven a cerrar la app y **no** se borran al cambiar el esquema del caché ni expiran |
| FR-609 | Sincronía | Un cambio en el detalle se ve al volver al listado, y quitar un favorito con el filtro activo lo saca de la lista al instante |

## Requisitos no funcionales

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| NFR-601 | Cero dependencias | Íconos PNG propios (@1x/@2x/@3x) y animaciones con `Animated` |
| NFR-602 | Clean Architecture | `FavoritesRepository` (interfaz) en dominio con reglas puras (`toggleFavorite`, `restoreFavorite`); implementación sobre `KeyValueStorage` en data; la búsqueda filtra favoritos en el dominio |
| NFR-603 | Accesibilidad | El botón se anuncia "Agregar X a favoritos" / "Quitar X de favoritos" con `accessibilityState.selected`. La tarjeta, que agrupa su contenido para el lector, expone la misma acción como `accessibilityActions` |
| NFR-604 | Pruebas | Reglas puras, repositorio (persistencia, datos corruptos), búsqueda con favoritos e integración (guardar, filtrar, quitar y deshacer) |
