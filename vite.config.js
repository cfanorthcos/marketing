import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The site is served from https://<user>.github.io/marketing/, so every asset
// URL needs that repo-name prefix. `npm run dev` keeps serving from "/".
export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/marketing/" : "/",
  plugins: [react()],
});
