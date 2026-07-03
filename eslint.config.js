export default [
  {
    ignores: [
      'node_modules',
      '.next',
      '.claude',
      'dist',
      'build',
      'coverage',
      '.git',
      '.env*',
      '*.log',
    ],
  },
  {
    rules: {
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
    },
  },
];
