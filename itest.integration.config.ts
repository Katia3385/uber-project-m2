import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        include: ['test/integration/**/*.it-spec.ts'],
        environment: 'node',
        testTimeout: 30000, // Les tests avec Docker peuvent être un peu lents
        hookTimeout: 30000,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});