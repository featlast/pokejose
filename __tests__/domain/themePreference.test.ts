import { ThemePreference } from '../../src/domain/enums';
import { nextThemePreference } from '../../src/domain/usecases/ThemePreferenceUseCases';

describe('nextThemePreference', () => {
  it('cycles Sistema → Claro → Oscuro → Sistema', () => {
    expect(nextThemePreference(ThemePreference.SYSTEM)).toBe(
      ThemePreference.LIGHT,
    );
    expect(nextThemePreference(ThemePreference.LIGHT)).toBe(
      ThemePreference.DARK,
    );
    expect(nextThemePreference(ThemePreference.DARK)).toBe(
      ThemePreference.SYSTEM,
    );
  });
});
