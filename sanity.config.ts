import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemaTypes";
import { structure } from "./sanity/structure";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

if (!projectId) {
  throw new Error(
    "NEXT_PUBLIC_SANITY_PROJECT_ID bulunamadı. .env.local dosyasının proje " +
      "kök dizininde olduğundan ve dev server'ın yeniden başlatıldığından " +
      "emin olun."
  );
}

export default defineConfig({
  basePath: "/studio",
  name: "sanayi-ucuzluk-pazari",
  title: "Sanayi Ucuzluk Pazarı — Yönetim Paneli",
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
  },
  plugins: [structureTool({ structure }), visionTool()],
});
