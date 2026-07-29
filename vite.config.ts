import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// GitHub Pages serves the project site under /<repo>/. Overridable via
// BASE_PATH for custom domains or local preview (`BASE_PATH=/ pnpm preview`).
const base = process.env.BASE_PATH ?? "/arkade-unilateral-exit/";

export default defineConfig({
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
});
