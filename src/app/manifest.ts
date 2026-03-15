import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Easy Weight Loss",
    short_name: "EWL",
    description: "Simple nutrition planner with daily macros and calendar history.",
    start_url: "/today",
    display: "standalone",
    background_color: "#f8f7f1",
    theme_color: "#fff8f3",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
