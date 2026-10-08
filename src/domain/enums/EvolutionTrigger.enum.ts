/** What makes a Pokémon evolve (PokéAPI `evolution-trigger`). */
export enum EvolutionTrigger {
  LEVEL_UP = 'level-up',
  USE_ITEM = 'use-item',
  TRADE = 'trade',
  /** Any other trigger (shed, spin, three critical hits…). */
  OTHER = 'other',
}
