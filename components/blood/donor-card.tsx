"use client";

import { useState } from "react";
import { Droplets, MapPin, ShieldCheck, MessageCircle, PhoneCall, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DonorContactForm } from "@/components/forms/donor-contact-form";
import { StatusBadge } from "@/components/shared/status-badge";
import type { PublicBloodDonor } from "@/types/database";
import { formatDate } from "@/lib/constants";

export function DonorCard({ donor }: { donor: PublicBloodDonor }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white p-5 transition-all hover:border-crescent/40 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-crescent-soft text-sm font-bold text-crescent">
            {donor.blood_group}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-semibold text-foreground">{donor.name}</h3>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                  donor.donor_type === "TEAM_MEMBER"
                    ? "bg-brand-soft text-brand-dark"
                    : donor.donor_type === "STUDENT"
                      ? "bg-poly-soft text-poly"
                      : "bg-mist text-muted-foreground"
                )}
              >
                {donor.donor_type === "TEAM_MEMBER"
                  ? "Team member"
                  : donor.donor_type === "STUDENT"
                    ? "Student"
                    : "Community"}
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" aria-hidden />
              {donor.area ?? "Campus area"}
            </p>
          </div>
        </div>
        <StatusBadge label="Available" tone="success" />
      </div>
      <div className="mt-4 flex items-center gap-4 border-t border-line pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Droplets className="h-3.5 w-3.5 text-crescent" aria-hidden />
          {donor.last_donation_date
            ? `Last donated ${formatDate(donor.last_donation_date)}`
            : "Ready to donate"}
        </span>
        <span
          className={cn(
            "flex items-center gap-1",
            donor.phone ? "text-brand" : ""
          )}
        >
          {donor.phone ? (
            <Eye className="h-3.5 w-3.5 text-brand" aria-hidden />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5 text-brand" aria-hidden />
          )}
          {donor.phone ? "Number public" : "Number private"}
        </span>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="mt-4 w-full border-crescent/30 text-crescent hover:bg-crescent-soft">
            {donor.phone ? (
              <PhoneCall className="mr-1.5 h-4 w-4" aria-hidden />
            ) : (
              <MessageCircle className="mr-1.5 h-4 w-4" aria-hidden />
            )}
            {donor.phone ? "View contact" : "Request Contact"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {donor.phone ? `Contact ${donor.name}` : `Request contact with ${donor.name}`}
            </DialogTitle>
          </DialogHeader>
          {donor.phone ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Donor contact number
              </p>
              <a
                href={`tel:${donor.phone}`}
                className="mt-2 block text-2xl font-bold text-emerald-900 hover:underline"
              >
                {donor.phone}
              </a>
              <p className="mt-2 text-xs leading-relaxed text-emerald-800">
                This donor chose to share their number publicly. Please mention the Red Crescent
                Blood Support team when you call.
              </p>
            </div>
          ) : (
            <DonorContactForm donorId={donor.id} donorName={donor.name} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
