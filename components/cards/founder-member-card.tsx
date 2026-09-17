import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Landmark, Sparkles } from "lucide-react";
import type { Founder } from "@/types/database";

export function FounderMemberCard({ founder }: { founder: Founder }) {
  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-poly/20 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-poly/50 hover:shadow-md">
      {/* Top Banner — Polytechnic Blue Stripe */}
      <div className="relative bg-gradient-to-r from-slate-900 via-poly-dark to-poly px-4 py-3 text-center text-white">
        <div className="flex items-center justify-center gap-2">
          <Landmark className="h-4 w-4 text-poly-light" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-white">
            Founder & Advisory Council
          </p>
        </div>

        {/* Category Badge */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-poly/30 bg-poly px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
          {founder.category === "PRINCIPAL" ? "Patron / Principal" : "Founding Member"}
        </div>
      </div>

      {/* Profile Photo */}
      <div className="relative mx-auto mt-6 aspect-square w-28 overflow-hidden rounded-full border-2 border-poly/30 bg-mist p-1 shadow-inner sm:w-32">
        <div className="relative h-full w-full overflow-hidden rounded-full">
          {founder.photo_url ? (
            <Image
              src={founder.photo_url}
              alt={founder.name}
              fill
              sizes="128px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-4xl font-bold text-poly/30">
              {founder.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-3 text-center">
        <h3 className="text-base font-bold text-foreground sm:text-lg">
          {founder.name}
        </h3>

        {founder.title && (
          <p className="mt-1 text-xs font-semibold text-poly">
            {founder.title}
          </p>
        )}

        {founder.bio && (
          <p className="mt-2.5 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {founder.bio}
          </p>
        )}

        <div className="mt-4 border-t border-line/60 pt-3">
          <Link
            href={`/founders/${founder.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-poly hover:text-poly-dark transition-colors"
          >
            <span>সম্পূর্ণ প্রোফাইল ও বাণী</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
