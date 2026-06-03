import type { MetadataRoute } from "next";
import { landingStrings } from "@/lib/i18n/landing";

/**
 * Web app manifest (served at /manifest.webmanifest). Enables install/PWA
 * affordances and richer mobile metadata. Icons reference the single SVG mark
 * in public/.
 */
export default function manifest(): MetadataRoute.Manifest {
  const s = landingStrings("en-US");
  return {
    name: "SigmaCV — academic CV generator",
    short_name: "SigmaCV",
    description: s.metaDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1f4fd8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
