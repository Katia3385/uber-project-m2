import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        include: ['test/unit/**/*.test.ts', 'test/integration/**/*.test.ts'],
        environment: 'node',
        // Les tests d'intégration partagent la même base : un fichier à la fois
        fileParallelism: false,
        testTimeout: 15000,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});