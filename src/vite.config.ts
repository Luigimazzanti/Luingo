import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa"; // 👈 IMPORTANTE

export default defineConfig({
  plugins: [
    react(),
    // ✅ CONFIGURACIÓN PWA (WEB APP)
    VitePWA({
      registerType: "autoUpdate",
      strategies: "generateSW",
      devOptions: {
        enabled: true,
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        cleanupOutdatedCaches: true,
      },
      // 👇 LISTA CORREGIDA: Solo lo que tienes en public
      includeAssets: [
        "apple-touch-icon.png",
        // He quitado favicon.ico y masked-icon.svg para que no falle el build
      ],
      manifest: {
        name: "LuinGo Campus",
        short_name: "LuinGo",
        description: "Plataforma de Aprendizaje Gamificado",
        theme_color: "#6344A6",
        background_color: "#F0F4F8",
        display: "standalone", // Esto quita la barra del navegador
        orientation: "portrait",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    alias: {
      "vaul@1.1.2": "vaul",
      "sonner@2.0.3": "sonner",
      "recharts@2.15.2": "recharts",
      "react-resizable-panels@2.1.7": "react-resizable-panels",
      "react-hook-form@7.55.0": "react-hook-form",
      "react-day-picker@8.10.1": "react-day-picker",
      "lucide-react@0.487.0": "lucide-react",
      "input-otp@1.4.2": "input-otp",
      "figma:asset/5c3aee031df4e645d2ea41499714325beb9cd4f4.png":
        path.resolve(
          __dirname,
          "./src/assets/5c3aee031df4e645d2ea41499714325beb9cd4f4.png",
        ),
      "embla-carousel-react@8.6.0": "embla-carousel-react",
      "cmdk@1.1.1": "cmdk",
      "class-variance-authority@0.7.1":
        "class-variance-authority",
      "@radix-ui/react-tooltip@1.1.8":
        "@radix-ui/react-tooltip",
      "@radix-ui/react-toggle@1.1.2": "@radix-ui/react-toggle",
      "@radix-ui/react-toggle-group@1.1.2":
        "@radix-ui/react-toggle-group",
      "@radix-ui/react-tabs@1.1.3": "@radix-ui/react-tabs",
      "@radix-ui/react-switch@1.1.3": "@radix-ui/react-switch",
      "@radix-ui/react-slot@1.1.2": "@radix-ui/react-slot",
      "@radix-ui/react-slider@1.2.3": "@radix-ui/react-slider",
      "@radix-ui/react-separator@1.1.2":
        "@radix-ui/react-separator",
      "@radix-ui/react-select@2.1.6": "@radix-ui/react-select",
      "@radix-ui/react-scroll-area@1.2.3":
        "@radix-ui/react-scroll-area",
      "@radix-ui/react-radio-group@1.2.3":
        "@radix-ui/react-radio-group",
      "@radix-ui/react-progress@1.1.2":
        "@radix-ui/react-progress",
      "@radix-ui/react-popover@1.1.6":
        "@radix-ui/react-popover",
      "@radix-ui/react-navigation-menu@1.2.5":
        "@radix-ui/react-navigation-menu",
      "@radix-ui/react-menubar@1.1.6":
        "@radix-ui/react-menubar",
      "@radix-ui/react-label@2.1.2": "@radix-ui/react-label",
      "@radix-ui/react-hover-card@1.1.6":
        "@radix-ui/react-hover-card",
      "@radix-ui/react-dropdown-menu@2.1.6":
        "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-dialog@1.1.6": "@radix-ui/react-dialog",
      "@radix-ui/react-context-menu@2.2.6":
        "@radix-ui/react-context-menu",
      "@radix-ui/react-collapsible@1.1.3":
        "@radix-ui/react-collapsible",
      "@radix-ui/react-checkbox@1.1.4":
        "@radix-ui/react-checkbox",
      "@radix-ui/react-avatar@1.1.3": "@radix-ui/react-avatar",
      "@radix-ui/react-aspect-ratio@1.1.2":
        "@radix-ui/react-aspect-ratio",
      "@radix-ui/react-alert-dialog@1.1.6":
        "@radix-ui/react-alert-dialog",
      "@radix-ui/react-accordion@1.2.3":
        "@radix-ui/react-accordion",
      "@jsr/supabase__supabase-js@2.49.8":
        "@jsr/supabase__supabase-js",
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    outDir: "build",
  },
  server: {
    port: 3000,
    open: true,
  },
});