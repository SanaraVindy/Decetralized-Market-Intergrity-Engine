import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        // Update this line to .jsx
        setupFiles: './src/setupTests.jsx',
        include: ['src/__tests__/**/*.{test,spec}.{js,jsx}'],
    },
});