/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Mapeia os aliases TypeScript (@/) para caminhos absolutos
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Ignora node_modules e build do Next
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  // Coleta cobertura dos arquivos de pagamento
  collectCoverageFrom: [
    'lib/payments/**/*.ts',
    'app/api/payments/**/*.ts',
    'app/api/webhooks/**/*.ts',
    '!**/*.d.ts',
  ],
  // Usa o tsconfig dedicado para testes (resolve aliases e habilita tipos do Jest)
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.test.json' }],
  },
}

module.exports = config
