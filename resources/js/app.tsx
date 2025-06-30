// resources/js/app.tsx

import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/components/theme-provider'; // <-- 1. IMPORT our new provider

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => title || appName,


    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),

    setup({ el, App, props }) {
        const root = createRoot(el);

        // 2. WRAP the entire application in the ThemeProvider.
        // This will provide the theme state (light/dark) to all components
        // and automatically add the 'dark' class to the <html> tag when needed.
        root.render(
            <ThemeProvider defaultTheme="dark" storageKey="co-mment-ui-theme">
                <App {...props} />
            </ThemeProvider>
        );
    },

    progress: {
        color: '#4B5563',
    },
});

// 3. REMOVED the old initializeTheme() call. The ThemeProvider now handles this.
