import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Red Crescent Youth - Rajshahi Polytechnic Institute",
    short_name: "RCSRGPI",
    description:
      "Official platform of Red Crescent Society Youth Unit at Rajshahi Polytechnic Institute. Emergency blood requests, donor directory, volunteer portal, notices, and community services.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#006f45",
    orientation: "portrait",
    categories: ["medical", "education", "social", "lifestyle"],
    shortcuts: [
      {
        name: "রক্তের অনুরোধ (Blood Support)",
        short_name: "Blood",
        description: "Emergency blood request and donor directory",
        url: "/blood-support",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "জরুরি সেবা (Emergency Helpline)",
        short_name: "Emergency",
        description: "Direct emergency contacts and helplines",
        url: "/emergency",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "নোটিশ বোর্ড (Notices)",
        short_name: "Notices",
        description: "Latest official circulars and notices",
        url: "/notices",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "ইভেন্টসমূহ (Events)",
        short_name: "Events",
        description: "Upcoming campaigns and activities",
        url: "/events",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
