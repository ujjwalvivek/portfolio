import { defineConfig } from 'vite';

export default defineConfig({
    envDir: '../../..',
    server: {
        proxy: {
            '/v1': {
                target: 'https://echopoint.ujjwalvivek.com',
                changeOrigin: true,
            },
        },
    },
});
