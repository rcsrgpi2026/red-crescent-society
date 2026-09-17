import { NextResponse } from "next/server";

/**
 * Serves an RFC 2426 compliant vCard (Virtual Contact File)
 * When opened on mobile devices (Android/iOS) or desktop clients,
 * it prompts the user to save "Red Crescent Youth RGPI" directly into their address book.
 */
export async function GET() {
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:RGPI;Red Crescent Youth;;;",
    "FN:Red Crescent Youth RGPI",
    "ORG:Bangladesh Red Crescent Society - RGPI Unit",
    "EMAIL;type=INTERNET,pref:supportrgpircy@gmail.com",
    "URL:https://rgpircy.vercel.app",
    "ADR;type=WORK:;;Rajshahi Govt. Polytechnic Institute, Kazla;Rajshahi;;6203;Bangladesh",
    "NOTE:Official contact for Red Crescent Youth RGPI broadcasts, notices & emergency blood requests.",
    "END:VCARD",
  ].join("\r\n");

  return new NextResponse(vcard, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rcy-rgpi.vcf"',
      "Cache-Control": "public, max-age=86400",
    },
  });
}
