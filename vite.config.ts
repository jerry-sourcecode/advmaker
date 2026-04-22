import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
// vite.config.ts
import { defineConfig } from 'vite';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        Components({
            resolvers: [NaiveUiResolver()],
        }),
        AutoImport({
            imports: [
                'vue',
                {
                    'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'],
                },
            ],
        }),
        vue(),
    ],
});
