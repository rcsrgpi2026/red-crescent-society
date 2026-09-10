import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Quote, Briefcase, GraduationCap, Handshake } from "lucide-react";
import { getFounders } from "@/lib/queries";
import { FOUNDER_CATEGORY_LABELS } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const founders = await getFounders();
  const person = founders.find((f) => f.id === id);
  if (!person) return { title: "Profile Not Found" };
  const label = FOUNDER_CATEGORY_LABELS[person.category] ?? "Leader";
  return {
    title: `${person.name} — ${label} · Rajshahi Polytechnic Institute Red Crescent Society`,
    description:
      person.message ??
      person.bio ??
      `Meet ${person.name}, ${label.toLowerCase()} of the Red Crescent Society at Rajshahi Polytechnic Institute.`,
  };
}

export default async function FounderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const founders = await getFounders();
  const person = founders.find((f) => f.id === id);
  if (!person) notFound();

  const isPrincipal = person.category === "PRINCIPAL";
  const categoryLabel = FOUNDER_CATEGORY_LABELS[person.category] ?? "Leader";
  const Icon = isPrincipal ? GraduationCap : Handshake;

  return (
    <>
      {/* Header */}
      <section className="border-b border-line bg-brand-dark">
        <div className="container-site py-14 lg:py-20">
          <Link
            href="/#founders"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to founders
          </Link>
          <div className="mt-8 flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                isPrincipal ? "bg-poly text-white" : "bg-white/10 text-white"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              {isPrincipal ? "Principal & Chief Patron" : categoryLabel}
            </p>
          </div>
          <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {person.name}
          </h1>
          {person.title && (
            <p className="mt-2 text-base font-medium text-crescent">{person.title}</p>
          )}
        </div>
      </section>

      <section className="bg-white">
        <div className="container-site py-12 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
            {/* Photo */}
            <div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-line bg-brand-soft shadow-sm">
                {person.photo_url ? (
                  <Image
                    src={person.photo_url}
                    alt={person.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-8xl font-bold text-brand/30">
                    {person.name.charAt(0)}
                  </div>
                )}
              </div>
              {person.bio && (
                <p className="mt-5 leading-relaxed text-muted-foreground">{person.bio}</p>
              )}
            </div>

            {/* Message + background */}
            <div className="space-y-8">
              <div className="rounded-3xl border border-line bg-gradient-to-b from-mist/60 to-white p-7 sm:p-9">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand">
                  <Quote className="h-4 w-4" aria-hidden />
                  Message to students &amp; volunteers
                </p>
                {person.message ? (
                  <div className="mt-4 whitespace-pre-line text-lg leading-relaxed text-foreground">
                    {person.message}
                  </div>
                ) : (
                  <p className="mt-4 text-sm italic text-muted-foreground">
                    A personal message from {person.name.split(" ")[0]} will appear here soon.
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-line bg-white p-7 sm:p-9">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-poly">
                  <Briefcase className="h-4 w-4" aria-hidden />
                  Working background
                </p>
                {person.background ? (
                  <div className="mt-4 whitespace-pre-line text-base leading-relaxed text-foreground">
                    {person.background}
                  </div>
                ) : (
                  <p className="mt-4 text-sm italic text-muted-foreground">
                    Background details for {person.name.split(" ")[0]} are being added.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
