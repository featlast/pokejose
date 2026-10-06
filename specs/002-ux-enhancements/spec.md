# Spec 002: Mejoras de experiencia (fuera del PDF)

> Fase **Specify** (SDD). Amplía la spec 001 con funcionalidades que los requisitos no piden.
> Se rige por `specs/constitution.md`: **cero dependencias externas**, Clean Architecture y SOLID.
> Estado: **Fases A–F implementadas.** *Enmienda:* el pull-to-refresh de marca (FR-218/219) se retiró por decisión del usuario; el listado usa el `RefreshControl` nativo con el color `primary`.

## Historias de usuario

- **HU-5.** Como usuario quiero ver una carga fluida y sin parpadeos mientras llegan los Pokémon y sus imágenes.
- **HU-6.** Como usuario quiero reconocer el tipo de cada Pokémon desde el listado, sin abrir el detalle.
- **HU-7.** Como usuario quiero elegir entre tema claro, oscuro o el del sistema.
- **HU-8.** Como usuario quiero buscar un Pokémon por nombre o número, incluso sin conexión.
- **HU-9.** Como usuario quiero más espacio para el listado al hacer scroll, sin perder la búsqueda.
- **HU-10.** Como usuario quiero que la imagen del Pokémon me "acompañe" al abrir el detalle.
- **HU-11.** ~~Como usuario quiero que actualizar el listado se sienta parte de la marca, y no un spinner genérico.~~ *Retirada por decisión del usuario.*
- **HU-12.** Como usuario quiero volver al inicio del listado con un toque cuando ya bajé mucho.

## Requisitos funcionales

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| FR-201 | Skeleton con shimmer | Mientras carga, las tarjetas skeleton muestran una franja de brillo que las recorre, animada en el driver nativo, en claro y en oscuro |
| FR-202 | Skeleton adaptado a la pantalla | Se muestran exactamente las tarjetas skeleton necesarias para llenar el viewport según columnas y alto |
| FR-203 | Sin parpadeo de skeleton | Si los datos llegan en menos de 150 ms (caché), no se muestra el skeleton. Si se muestra, dura al menos 300 ms |
| FR-204 | Carga progresiva de imágenes | Cada imagen muestra un placeholder y aparece con un *fade-in* al cargar. Si falla, queda un placeholder con la silueta genérica, sin romper la tarjeta |
| FR-205 | Precarga de la página siguiente | Cuando quedan ≤ 10 elementos por debajo de lo visible, se pide la página siguiente (queda en caché, así "cargar más" es instantáneo) y se precargan sus imágenes con `Image.prefetch`, una sola vez por página y sin bloquear la UI |
| FR-206 | Cinta de tipo en la tarjeta | Cada tarjeta muestra en su esquina superior izquierda una cinta diagonal con el nombre y el color del **tipo principal** (slot 1) |
| FR-207 | Cinta sin costo por tarjeta | Los tipos del listado se obtienen de un índice de tipos (`/type/{nombre}`, una sola vez y cacheado), que incluye las formas alternativas. **No** se hace una petición de detalle por tarjeta |
| FR-208 | Cinta tolerante a fallos | Si el índice de tipos aún no está o falló, la tarjeta se muestra sin cinta y la cinta aparece con un *fade-in* cuando el índice esté disponible. El listado nunca espera al índice |
| FR-209 | Selector de tema | Opción Sistema / Claro / Oscuro accesible desde el header del listado. "Sistema" sigue al sistema operativo en tiempo real |
| FR-210 | Arranque en tema del sistema | *Enmienda (pedido del usuario):* la app **siempre inicia en "Sistema"**. La elección manual Claro / Oscuro aplica durante la sesión y **no se guarda en disco**; al volver a abrir la app se sigue de nuevo al sistema operativo |
| FR-211 | Tema en lo nativo | La barra de estado, el teclado y los componentes nativos respetan el tema elegido (`Appearance.setColorScheme`) |
| FR-212 | Búsqueda por nombre o número | Una barra de búsqueda filtra por nombre (coincidencia parcial, sin distinguir mayúsculas ni acentos) o por número (`25`, `#025`) |
| FR-213 | Búsqueda eficiente y offline | Se descarga una vez el índice de nombres (`/pokemon?limit=100000`), se cachea en disco con TTL y se busca localmente con *debounce* de 250 ms. Funciona sin conexión si el índice ya existe |
| FR-214 | Estados de búsqueda | Sin resultados → estado vacío con el término buscado. Índice cargando → indicador. Índice fallido sin caché → mensaje amigable con reintento. Al limpiar la búsqueda se vuelve al listado paginado conservando el scroll |
| FR-215 | Header colapsable | Al hacer scroll, el título grande "Pokédex" se reduce y se desvanece, y el header compacto muestra el **ícono de la app** junto a la **barra de búsqueda**, que queda fija. Al volver arriba se expande de nuevo |
| FR-216 | Header fluido | La animación del header corre en el driver nativo, sigue al dedo sin saltos y convive con el pull-to-refresh en Android e iOS |
| FR-217 | Shared transition (**última fase**) | Al tocar una tarjeta, su imagen se desplaza y escala hasta el hero del detalle mientras el detalle aparece con un fundido. Al regresar, vuelve a la tarjeta. Si la tarjeta no es medible o no está completamente visible, se usa un fundido simple. El gesto de borde de iOS desliza la página |
| FR-218 | ~~Pull-to-refresh de marca~~ (retirado) | *Retirado por decisión del usuario:* el listado vuelve al `RefreshControl` nativo, con el spinner en el color `primary` del tema y bajo el header en ambas plataformas |
| FR-219 | ~~Estados del pull-to-refresh~~ (retirado) | *Retirado junto con FR-218*, incluido el componente nativo `PullRefreshLayout` de Android |
| FR-220 | Botón volver arriba | Después de 2 pantallas de scroll aparece, centrado abajo y respetando el safe area, un botón circular con sombra suave y un chevron hacia arriba que contrasta con el tema efectivo: **rojo con chevron blanco** en tema claro y **blanco con chevron rojo** en tema oscuro (también cuando "Sistema" resuelve a claro u oscuro, y cambia en caliente). Al tocarlo la lista vuelve al inicio. Se oculta cerca del inicio. Funciona en el listado y en los resultados de búsqueda. *Enmienda (decisión del usuario): se reemplazó el diseño anterior (mini Pokéball con anillo de progreso y lanzamiento) por el de la referencia visual* |
| FR-222 | Iconos de tema propios | El selector muestra tres iconos de la marca derivados de la esfera Lumen (Sistema: esfera partida · Claro: esfera-sol · Oscuro: luna creciente con costura), iguales en iOS y Android, en blanco sobre el header. Al cambiar, el icono gira un cuarto de vuelta con fundido; con "Reducir movimiento" solo hay fundido |
| FR-223 | Listado = Pokédex nacional | El listado y su contador cubren solo las especies (`/pokemon-species`: #1–#1025 hoy), así que se lee "20 de 1025 Pokémon" y la paginación termina en el último. Las formas alternativas (#10001+) no aparecen en el listado, pero siguen en la búsqueda (ADR-10). Buscar un número mayor que el total responde "No existe el #N. La Pokédex llega hasta el #1025." |
| FR-224 | Resultados siempre bajo el header | La primera fila de resultados de búsqueda queda completa bajo el header compacto en iOS y Android, sin importar el scroll previo ni cuántos resultados haya |
| FR-221 | Tema en los controles | El botón volver arriba y el spinner nativo del pull-to-refresh toman sus colores del tema activo y cambian en caliente entre claro, oscuro y sistema |

## Requisitos no funcionales

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| NFR-201 | Cero dependencias | `dependencies` sigue siendo solo `react` y `react-native` |
| NFR-202 | Clean Architecture | Índice de tipos e índice de búsqueda entran por interfaces de dominio con implementaciones en `data`. La UI solo consume casos de uso. (La preferencia de tema ya no se persiste, ver FR-210.) |
| NFR-203 | SOLID | Cada capacidad nueva tiene su propia interfaz de repositorio (ISP). No se agranda `PokemonRepository` con responsabilidades ajenas (SRP) |
| NFR-204 | Rendimiento | El scroll del listado se mantiene a 60 fps con cinta, shimmer y header animado. Las animaciones continuas usan el driver nativo |
| NFR-205 | Accesibilidad | El tipo se incluye en el `accessibilityLabel` de la tarjeta. Con "Reducir movimiento", shimmer, *fade-in*, header y shared transition se reemplazan por cambios sin animación. La cinta cumple contraste AA |
| NFR-206 | Pruebas | Cada requisito tiene prueba unitaria o de integración. Las compuertas de la spec 001 siguen pasando |
| NFR-208 | Animaciones de controles | El botón volver arriba anima en el driver nativo y respeta "Reducir movimiento". El botón tiene `accessibilityRole="button"`, etiqueta "Volver al inicio" y un área táctil ≥ 48 |
| NFR-207 | Datos acotados | El índice de tipos (~18 peticiones de ~20 KB) y el de nombres (~100 KB) se descargan una vez y se cachean 7 días |

## Fuera de alcance (esta iteración)

- **Filtros por tipo.** Se pospusieron por decisión del usuario. *Habilitados después en la spec 003*
  sobre el índice de tipos de FR-207, sin peticiones nuevas.
- Favoritos, evoluciones, búsqueda por habilidad o por tipo.
- Nombres de Pokémon traducidos (la API los da en inglés en el índice).

## Decisiones tomadas

- **FR-218 a FR-220 (diseño):** se prototiparon en Rive (en el archivo del usuario en Rive, mesas *PullToRefresh*, *ScrollTop Demo*; no hay copia en el repo) y se implementan con `Animated`, sin runtime de Rive (constitución §2). *Enmienda:* el botón volver arriba ya no usa ese diseño ("energía en la costura" sobre la mini Pokéball); el usuario eligió un círculo con sombra y chevron (ver FR-220). *Enmienda 2:* el pull-to-refresh de marca también se retiró (FR-218/219), así que la app no usa ninguna parte del prototipo de Rive.

- **FR-209:** selector manual Sistema / Claro / Oscuro (el usuario pidió proceder con la spec).
- **FR-210 (enmienda):** el usuario pidió que la app arranque siempre con el tema del sistema. Se retiró la persistencia (repositorio, casos de uso Get/Set y su cableado en el DI) en lugar de dejar código sin uso.
- **FR-206:** la cinta muestra solo el **tipo principal**. El segundo tipo sigue visible en el detalle.
- **FR-215 (ajuste tras probar en dispositivo):** al empezar a buscar, el header se colapsa
  con animación y los resultados quedan bajo el header compacto (evita un hueco visual).
