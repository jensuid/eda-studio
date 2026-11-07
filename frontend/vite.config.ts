import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" agar asset relatif: frontend di-host via file:// oleh PyWebView
// (dev maupun .app bundle), path absolut "/assets/..." akan 404 -> layar putih.
export default defineConfig({ plugins: [react()], base: "./" });
