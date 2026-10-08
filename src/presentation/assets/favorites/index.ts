/**
 * Pokéball-heart favorite icons (FR-601), drawn for this app in the family of
 * the theme icons. `outline` is white on transparent so `tintColor` paints it;
 * `ball` keeps its own colours; `solid` is the white silhouette for coloured headers.
 */
import ball from './heart_ball.png';
import outline from './heart_outline.png';
import solid from './heart_solid.png';

export const favoriteIcons = { ball, outline, solid } as const;
