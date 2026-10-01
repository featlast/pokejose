import type { HttpClient } from '../../src/core/http/HttpClient.interface';
import { PokeApiRemoteDataSource } from '../../src/data/datasources/remote/PokeApiRemoteDataSource';

const species = (id: number, name: string) => ({
  name,
  url: `https://pokeapi.co/api/v2/pokemon-species/${id}/`,
});

describe('PokeApiRemoteDataSource.fetchPage', () => {
  it('pages over the National Pokédex (species), not over every form', async () => {
    const get = jest.fn().mockResolvedValue({
      count: 1025,
      next: 'https://pokeapi.co/api/v2/pokemon-species?offset=20&limit=20',
      results: [species(1, 'bulbasaur'), species(2, 'ivysaur')],
    });
    const source = new PokeApiRemoteDataSource({
      get,
    } as unknown as HttpClient);

    const page = await source.fetchPage(0, 20);

    expect(get).toHaveBeenCalledWith('pokemon-species?limit=20&offset=0');
    expect(page.totalCount).toBe(1025);
    expect(page.items[0]).toMatchObject({ id: 1, name: 'bulbasaur' });
    expect(page.items[0].imageUrl).toMatch(/\/1\.png$/);
  });

  it('ends at the last species instead of continuing into forms (#10001+)', async () => {
    const get = jest.fn().mockResolvedValue({
      count: 1025,
      next: null,
      results: [species(1024, 'terapagos'), species(1025, 'pecharunt')],
    });
    const source = new PokeApiRemoteDataSource({
      get,
    } as unknown as HttpClient);

    const page = await source.fetchPage(1020, 20);

    expect(page.items.map(item => item.id)).toEqual([1024, 1025]);
    expect(page.nextOffset).toBeNull();
  });
});
