/// <reference types="vitest" />
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const apiProxyRegex = /^\/api/;
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(env.PORT) || 9527;
  const proxyUrl = env.PROXY_URL;
  return {
    plugins: [
      react(),
      tailwindcss(),
      viteStaticCopy({
        targets: [
          {
            src: "src/i18n/*.json",
            dest: "locales",
          },
        ],
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port,
      open: true,
      proxy: {
        "/api": {
          target: proxyUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(apiProxyRegex, ""),
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./tests/setup.ts",
    },
  };
});
