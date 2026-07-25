import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base relativo: el build funciona bajo la subruta de GitHub Pages
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
});
