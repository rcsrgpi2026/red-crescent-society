"use client";

import { useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@/components/promo/use-gsap";
import { promoBeats } from "@/components/promo/promo-beats";
import { ArrowRight, Play } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const CinematicCanvas = dynamic(
  () => import("@/components/promo/cinematic-canvas").then((m) => m.CinematicCanvas),
  { ssr: false, loading: () => <div className="h-full w-full bg-[#07110d]" aria-hidden /> }
);

export function PromoCinematic() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Mutable refs — GSAP writes, R3F reads in useFrame. No React re-renders on scroll.
  const cameraRef = useRef({ x: 0, y: 0.7, z: 8 });
  const targetRef = useRef({ x: 0, y: 0, z: 0 });
  const morphRef = useRef({ scale: 1, rotationY: 0, color: "#006f45" });

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set("[data-chapter]", { opacity: 1, y: 0 });
        return;
      }

      const setProgress = progressRef.current
        ? gsap.quickSetter(progressRef.current, "scaleX")
        : null;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onUpdate: (self) => setProgress?.(self.progress),
        },
      });

      promoBeats.forEach((beat) => {
        const start = beat.start / 100;
        const duration = Math.max(0.01, (beat.end - beat.start) / 100);
        tl.to(cameraRef.current, { ...beat.camera, ease: "none", duration }, start);
        tl.to(targetRef.current, { ...beat.target, ease: "none", duration }, start);
        tl.to(
          morphRef.current,
          { scale: 1 + (beat.start / 100) * 0.6, color: beat.accent, ease: "none", duration },
          start
        );
        tl.to({}, { duration: 0.001 }, start);
      });

      // Chapter overlays: fade/slide per beat window
      promoBeats.forEach((beat) => {
        const el = sectionRef.current?.querySelector(`[data-chapter="${beat.id}"]`);
        if (!el) return;
        const textTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: `${beat.start}% top`,
            end: `${beat.end}% top`,
            scrub: 0.5,
          },
        });
        if (beat.id === "hero") {
          gsap.set(el, { opacity: 1, y: 0 });
          textTl.to(el, { opacity: 0, y: -40, ease: "power2.in" });
        } else {
          textTl
            .fromTo(el, { opacity: 0, y: 48 }, { opacity: 1, y: 0, ease: "power2.out", duration: 0.3 })
            .to({}, { duration: 0.4 })
            .to(el, { opacity: 0, y: -40, ease: "power2.in", duration: 0.3 });
        }
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="relative" aria-label="RCY promotional cinematic">
      {/* Scroll space: 6 beats */}
      <div className="relative h-[620vh]">
        <div className="sticky top-0 h-screen overflow-hidden bg-[#07110d] text-white">
          <div className="absolute inset-0" aria-hidden>
            <CinematicCanvas camera={cameraRef} target={targetRef} morph={morphRef} />
          </div>
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50"
            aria-hidden
          />

          {/* Progress */}
          <div className="absolute inset-x-0 top-0 z-20 h-1 bg-white/10" aria-hidden>
            <div ref={progressRef} className="h-full origin-left scale-x-0 bg-[#ed1c24]" />
          </div>

          {/* Chapters */}
          <div className="relative z-10 mx-auto flex h-full w-full max-w-5xl flex-col justify-end px-5 pb-24 sm:justify-center sm:pb-0">
            {promoBeats.map((beat) => (
              <article
                key={beat.id}
                data-chapter={beat.id}
                className="pointer-events-none absolute inset-x-5 bottom-24 opacity-0 sm:inset-x-8 sm:bottom-auto"
                aria-label={`${beat.time} — ${beat.title}`}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">
                  {beat.time} • {beat.kicker}
                </p>
                <h2 className="mt-3 max-w-2xl text-balance text-3xl font-bold leading-tight sm:text-5xl">
                  {beat.title}
                </h2>
                <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-white/75 sm:text-base">
                  {beat.body}
                </p>
                {beat.cta && (
                  <div className="pointer-events-auto mt-6">
                    <Link
                      href={beat.cta.href}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0b1f17] transition hover:bg-white/90"
                    >
                      <Play className="h-4 w-4" aria-hidden />
                      {beat.cta.label}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* Scroll hint */}
          <p className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/50">
            Scroll to play
          </p>
        </div>
      </div>

      {/* Reduced-motion / SEO fallback: stacked chapters */}
      <div className="bg-[#07110d] px-5 pb-16 text-white sm:hidden">
        {promoBeats.map((b) => (
          <div key={b.id} className="border-t border-white/10 py-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">{b.kicker}</p>
            <h3 className="mt-2 text-xl font-bold">{b.title}</h3>
            <p className="mt-2 text-sm text-white/70">{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
