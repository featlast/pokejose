import { ErrorCode } from '../../src/core/errors';
import type { PokemonRepository } from '../../src/domain/repositories/PokemonRepository.interface';
import { GetPokemonDetailUseCase } from '../../src/domain/usecases/GetPokemonDetailUseCase';
import { GetPokemonPageUseCase } from '../../src/domain/usecases/GetPokemonPageUseCase';
import {
  bulbasaurDetail,
  makePage,
  resource,
} from '../fixtures/pokemon.fixtures';

const createRepository = (): jest.Mocked<PokemonRepository> => ({
  getPokemonPage: jest.fn().mockResolvedValue(resource(makePage([1]))),
  getPokemonDetail: jest.fn().mockResolvedValue(resource(bulbasaurDetail)),
});

describe('GetPokemonPageUseCase', () => {
  it('requests the configured page size (first 20 by default)', async () => {
    const repository = createRepository();

    await new GetPokemonPageUseCase(repository, 20).execute();

    expect(repository.getPokemonPage).toHaveBeenCalledWith(0, 20, undefined);
  });

  it('clamps negative offsets and forwards the fetch policy', async () => {
    const repository = createRepository();

    await new GetPokemonPageUseCase(repository, 20).execute(-5, {
      forceRefresh: true,
    });

    expect(repository.getPokemonPage).toHaveBeenCalledWith(0, 20, {
      forceRefresh: true,
    });
  });
});

describe('GetPokemonDetailUseCase', () => {
  it('delegates valid ids to the repository', async () => {
    const repository = createRepository();

    const result = await new GetPokemonDetailUseCase(repository).execute(1);

    expect(result.data).toBe(bulbasaurDetail);
  });

  it.each([0, -1, 1.5, NaN])('rejects invalid id %p', async id => {
    const repository = createRepository();

    await expect(
      new GetPokemonDetailUseCase(repository).execute(id),
    ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
    expect(repository.getPokemonDetail).not.toHaveBeenCalled();
  });
});
