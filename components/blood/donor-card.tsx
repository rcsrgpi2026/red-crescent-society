"use client";

import { useState } from "react";
import { Droplets, MapPin, ShieldCheck, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
            <h3 className="font-semibold text-foreground">{donor.name}</h3>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
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
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-brand" aria-hidden />
          Number private
        </span>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="mt-4 w-full border-crescent/30 text-crescent hover:bg-crescent-soft">
            <MessageCircle className="mr-1.5 h-4 w-4" aria-hidden />
            Request Contact
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request contact with {donor.name}</DialogTitle>
          </DialogHeader>
          <DonorContactForm donorId={donor.id} donorName={donor.name} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
