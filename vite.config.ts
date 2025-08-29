import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig, loadEnv } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const apiProxyRegex = /^\/api/
    const env = loadEnv(mode, process.cwd(), '')
    const port = Number(env.PORT) || 9527
    const proxyUrl = env.PROXY_URL
    return {
        plugins: [
            react(),
            tailwindcss(),
            viteStaticCopy({
                targets: [
                    {
                        src: 'src/i18n/*.json',
                        dest: 'locales',
                    },
                ],
            }),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            host: '0.0.0.0',
            port,
            open: true,
            proxy: {
                '/api': {
                    target: proxyUrl,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(apiProxyRegex, ''),
                },
            },
        },
        test: {
            globals: true, // 允許使用 describe/it/test 等全域方法
            environment: 'jsdom', // 模擬瀏覽器
            setupFiles: './src/tests/setup.ts', // 可選：放置初始化設定
            coverage: {
                provider: 'v8', // 或 istanbul
                reporter: ['text', 'json', 'html'],
                exclude: [
                    'node_modules/',
                    'src/test/',
                    '**/*.d.ts',
                    '**/*.config.*',
                    '**/coverage/**',
                ],
            },
        },
    }
})
