"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HeartHandshake, Send, CheckCircle2, Loader2, MessageSquarePlus } from "lucide-react";
import { submitBloodDonorOffer } from "@/lib/actions";
import { toast } from "sonner";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

interface DonorResponseModalProps {
  requestId: string;
  patientName: string;
  requiredBloodGroup: string;
  hospital?: string | null;
  location?: string | null;
}

export function DonorResponseModal({
  requestId,
  patientName,
  requiredBloodGroup,
  hospital,
  location,
}: DonorResponseModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [donorBloodGroup, setDonorBloodGroup] = useState<string>(requiredBloodGroup);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("requestId", requestId);
    formData.set("patientName", patientName);
    formData.set("requiredBloodGroup", requiredBloodGroup);
    formData.set("hospital", hospital || location || "Rajshahi");
    formData.set("donorBloodGroup", donorBloodGroup);

    startTransition(async () => {
      const res = await submitBloodDonorOffer(null, formData);
      if (res.success) {
        setSubmitted(true);
        toast.success("Message sent to Admin!", {
          description: "Our volunteer coordinators will reach out to you shortly.",
        });
      } else {
        setError(res.message || "Failed to send message.");
        toast.error("Could not send message", { description: res.message });
      }
    });
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      // Reset submitted status after modal closes
      setTimeout(() => {
        setSubmitted(false);
        setError(null);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-center gap-2 rounded-xl border-crescent/40 bg-white py-3 text-sm font-bold text-crescent hover:bg-crescent-soft/70 hover:text-crescent-dark active:scale-[0.99] shadow-xs"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Send Direct Message to Admin
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <HeartHandshake className="h-5 w-5 text-crescent" />
            I Want to Donate Blood
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Send your contact details directly to the Red Crescent coordinators.
          </DialogDescription>
        </DialogHeader>

        {/* Patient / Requirement Summary Box */}
        <div className="rounded-xl border border-line bg-mist/60 p-3.5 text-xs text-foreground">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Patient:</span>
            <span className="font-bold">{patientName}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Required Group:</span>
            <span className="font-bold text-crescent">{requiredBloodGroup}</span>
          </div>
          {(hospital || location) && (
            <div className="mt-1 flex items-center justify-between">
              <span className="font-semibold text-muted-foreground">Hospital:</span>
              <span className="font-medium truncate max-w-[200px]">{hospital || location}</span>
            </div>
          )}
        </div>

        {submitted ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-base font-bold text-foreground">
              Thank You for Your Generosity!
            </h4>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed px-4">
              Your details have been delivered to our volunteer coordinator inbox. We will call you shortly to connect with the patient attendant.
            </p>
            <Button
              className="mt-5 w-full bg-brand hover:bg-brand-dark"
              onClick={() => handleOpenChange(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-2 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="donorName" className="text-xs font-semibold">
                Your Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="donorName"
                name="donorName"
                placeholder="e.g. Mehedi Hasan"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="donorPhone" className="text-xs font-semibold">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="donorPhone"
                  name="donorPhone"
                  type="tel"
                  placeholder="017XXXXXXXX"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Your Blood Group <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={donorBloodGroup}
                  onValueChange={setDonorBloodGroup}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((bg) => (
                      <SelectItem key={bg} value={bg} className="text-xs">
                        {bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-xs font-semibold">
                When can you donate? / Note (Optional)
              </Label>
              <Textarea
                id="note"
                name="note"
                placeholder="e.g. Available today after 3 PM, near hospital..."
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-crescent hover:bg-crescent-dark font-bold text-white shadow-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending to Admin...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Details to Red Crescent Admin
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
