import type { Route } from '../../src/presentation/navigation';
import { stackReducer } from '../../src/presentation/navigation/stackReducer';

const root: Route = { key: 'root', name: 'PokemonList', params: undefined };

describe('stackReducer', () => {
  it('pushes a typed route on top', () => {
    const stack = stackReducer([root], {
      type: 'PUSH',
      key: 'detail-1',
      name: 'PokemonDetail',
      params: { id: 1, name: 'bulbasaur', imageUrl: 'x' },
    });
    expect(stack.map(r => r.key)).toEqual(['root', 'detail-1']);
  });

  it('pops the top route but never the root', () => {
    const pushed = stackReducer([root], {
      type: 'PUSH',
      key: 'detail-1',
      name: 'PokemonDetail',
      params: { id: 1, name: 'bulbasaur', imageUrl: 'x' },
    });
    const popped = stackReducer(pushed, { type: 'POP' });
    expect(popped).toEqual([root]);
    expect(stackReducer(popped, { type: 'POP' })).toEqual([root]);
  });
});
