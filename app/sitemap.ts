import type { MetadataRoute } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const staticRoutes = [
    "",
    "/volunteers",
    "/blood-support",
    "/blood-support/request",
    "/events",
    "/activities",
    "/notices",
    "/gallery",
    "/training",
    "/contact",
    "/emergency",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  if (!isSupabaseConfigured) {
    return staticRoutes;
  }

  const supabase = await createClient();

  const [events, activities, notices, volunteers, albums] = await Promise.all([
    supabase.from("events").select("slug, updated_at").neq("status", "DRAFT"),
    supabase.from("activities").select("slug, updated_at"),
    supabase.from("notices").select("slug, updated_at"),
    supabase.from("public_volunteers").select("id"),
    supabase.from("gallery_albums").select("slug"),
  ]);

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...(events.data ?? []).map((e) => ({
      url: `${baseUrl}/events/${e.slug}`,
      lastModified: new Date(e.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...(activities.data ?? []).map((a) => ({
      url: `${baseUrl}/activities/${a.slug}`,
      lastModified: new Date(a.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...(notices.data ?? []).map((n) => ({
      url: `${baseUrl}/notices/${n.slug}`,
      lastModified: new Date(n.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...(volunteers.data ?? []).map((v) => ({
      url: `${baseUrl}/volunteers/${v.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    ...(albums.data ?? []).map((a) => ({
      url: `${baseUrl}/gallery/${a.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
