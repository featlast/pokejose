module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // All text goes through AppText so typeface, size, color and font scaling
    // always come from the typography tokens.
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'react-native',
            importNames: ['Text'],
            message:
              'Usa AppText (src/presentation/components/AppText) para aplicar la tipografía del tema.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      // AppText is the single wrapper around Text; tests may use it as a plain child.
      files: ['src/presentation/components/AppText.tsx', '__tests__/**'],
      rules: { 'no-restricted-imports': 'off' },
    },
  ],
};
