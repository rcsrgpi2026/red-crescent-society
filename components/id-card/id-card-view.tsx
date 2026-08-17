import type { CardConfig, CardSide } from "@/types/id-card";
import { resolveQrData } from "@/lib/id-card/config";
import { CARD_BASE_WIDTH } from "@/lib/id-card/constants";
import { Phone, Mail, Globe, MapPin } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface IDCardViewProps {
  config: CardConfig;
  side?: CardSide;
  scale?: number;
  showGuides?: boolean;
  className?: string;
  /** DOM id of the rendered card root — used by the PNG/PDF export. */
  id?: string;
}

/**
 * Renders the CR80-style membership card at its base pixel size (1012×638).
 * The card is plain CSS + inline styles so it can be captured to PNG/PDF
 * with html-to-image. `scale` only resizes the display — the captured
 * element is always the full-resolution card.
 */
export function IDCardView({
  config,
  side = "front",
  scale = 1,
  showGuides = false,
  className = "",
  id = "printable-card",
}: IDCardViewProps) {
  const {
    member,
    photo,
    logos,
    watermark,
    header,
    labels,
    typography,
    fields,
    footer,
    design,
    layout,
    backSide,
  } = config;

  const cardWidth = design.width;
  const cardHeight = design.height;

  const hasPhoto = photo.visible && Boolean(photo.src);

  const renderContactIcon = (type: string) => {
    switch (type) {
      case "phone":
        return (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
            <Phone size={11} className="fill-current text-white" />
          </div>
        );
      case "facebook":
        return (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
            <svg className="h-3 w-3 fill-current text-white" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
        );
      case "email":
        return (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-red-600 shadow-xs">
            <Mail size={11} className="font-bold text-red-600" />
          </div>
        );
      case "web":
        return (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white shadow-xs">
            <Globe size={11} className="text-white" />
          </div>
        );
      case "location":
        return (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
            <MapPin size={11} className="text-white" />
          </div>
        );
      default:
        return null;
    }
  };

  const isPortrait = design.orientation === "portrait";
  const portraitScale = cardWidth / CARD_BASE_WIDTH;

  // ------------------- PORTRAIT / VERTICAL LAYOUTS -------------------

  function renderPortraitFront() {
    const ps = portraitScale;
    const pPhotoW = Math.round(Math.min(photo.width, 230));
    const pPhotoH = Math.round((pPhotoW * photo.height) / Math.max(photo.width, 1));

    const infoRow = (label: string, value: string) => (
      <div className="flex w-full items-baseline">
        <span
          className="flex-shrink-0 pr-2"
          style={{
            fontFamily: typography.labelFontFamily,
            fontSize: `${Math.round(typography.labelFontSize * ps)}px`,
            fontWeight: typography.labelFontWeight,
            color: typography.labelColor,
            // Labels are single-line by design — never wrap, or the row shifts.
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
        <div
          className="flex-1 truncate pb-0.5 pl-1 font-bold"
          style={{
            fontFamily: typography.valueFontFamily,
            fontSize: `${Math.round(typography.valueFontSize * ps)}px`,
            fontWeight: typography.valueFontWeight,
            color: typography.valueColor,
            borderBottom: `${typography.underlineThickness}px solid ${typography.underlineColor}`,
          }}
        >
          {value || "—"}
        </div>
      </div>
    );

    return (
      <div className="relative z-10 flex h-full flex-col justify-between">
        {/* Header: logos + titles stacked */}
        <div
          className="flex flex-col items-center px-8"
          style={{
            marginTop: `${Math.round(header.marginTop * 0.7)}px`,
            marginBottom: `${header.marginBottom}px`,
          }}
        >
          <div className="flex items-center gap-4">
            {logos.instituteLogo.visible && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logos.instituteLogo.src}
                alt="Institute Logo"
                className="h-[74px] w-[74px] object-contain"
                style={{ opacity: logos.instituteLogo.opacity }}
                crossOrigin="anonymous"
                draggable={false}
              />
            )}
            {logos.redCrescentLogo.visible && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logos.redCrescentLogo.src}
                alt="Red Crescent Logo"
                className="h-[74px] w-[74px] object-contain"
                style={{ opacity: logos.redCrescentLogo.opacity }}
                crossOrigin="anonymous"
                draggable={false}
              />
            )}
          </div>
          <h1
            style={{
              fontFamily: header.instituteTitleFont,
              fontSize: `${Math.round(header.instituteTitleSize * ps)}px`,
              fontWeight: header.instituteTitleWeight,
              fontStyle: header.instituteTitleStyle || "normal",
              color: header.instituteTitleColor,
              letterSpacing: `${header.instituteTitleTracking}px`,
              lineHeight: 1.15,
              whiteSpace: "nowrap",
            }}
            className="mt-3 text-center uppercase"
          >
            {header.instituteTitle}
          </h1>
          <h2
            style={{
              fontFamily: header.orgTitleFont,
              fontSize: `${Math.round(header.orgTitleSize * ps)}px`,
              fontWeight: header.orgTitleWeight,
              fontStyle: header.orgTitleStyle || "normal",
              color: header.orgTitleColor,
              letterSpacing: `${header.orgTitleTracking}px`,
              marginTop: `${header.lineSpacing}px`,
              lineHeight: 1.15,
              whiteSpace: "nowrap",
            }}
            className="text-center uppercase"
          >
            {header.orgTitle}
          </h2>
        </div>

        {/* Photo: centered with valid-until below */}
        {photo.visible && (
          <div
            className="flex flex-col items-center"
            style={{
              transform: `translate(${layout.photoOffsetX}px, ${layout.photoOffsetY}px)`,
            }}
          >
            <div
              className="relative overflow-hidden"
              style={{
                width: `${pPhotoW}px`,
                height: `${pPhotoH}px`,
                borderRadius: `${photo.borderRadius}px`,
                border: photo.frameVisible
                  ? `${photo.borderWidth}px solid ${photo.borderColor}`
                  : "none",
                boxShadow: photo.shadow
                  ? "0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -4px rgba(0, 0, 0, 0.2)"
                  : "none",
                backgroundColor: "#f1f5f9",
              }}
            >
              {photo.frameVisible && (
                <div
                  className="pointer-events-none absolute inset-0 rounded-[inherit]"
                  style={{
                    boxShadow: `inset 0 0 0 ${photo.outerBorderWidth}px ${photo.outerBorderColor}`,
                  }}
                />
              )}
              {hasPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.src}
                  alt={member.name || "Member"}
                  style={{
                    transform: `translate(${photo.x}px, ${photo.y}px) scale(${photo.scale}) rotate(${photo.rotate}deg)`,
                    transformOrigin: "center center",
                    objectFit: photo.objectFit,
                  }}
                  className="pointer-events-none block h-full w-full select-none"
                  crossOrigin="anonymous"
                  draggable={false}
                />
              ) : (
                <span className="flex h-full w-full select-none items-center justify-center bg-gradient-to-br from-brand-soft to-brand/20 text-5xl font-bold text-brand/40">
                  {(member.name || "M").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {fields.validUntil && member.validUntil && (
              <div className="mt-3 flex items-baseline gap-2">
                <span
                  style={{
                    fontFamily: typography.labelFontFamily,
                    fontSize: `${Math.round(typography.labelFontSize * ps)}px`,
                    fontWeight: typography.labelFontWeight,
                    color: typography.labelColor,
                  }}
                >
                  {labels.validUntil}
                </span>
                <span
                  className="min-w-[60px] border-b px-3 pb-0.5 text-center font-bold"
                  style={{
                    fontFamily: typography.valueFontFamily,
                    fontSize: `${Math.round((typography.valueFontSize + 1) * ps)}px`,
                    fontWeight: "700",
                    color: typography.valueColor,
                    borderColor: typography.underlineColor,
                    borderBottomWidth: `${typography.underlineThickness}px`,
                  }}
                >
                  {member.validUntil}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Info: every field on its own full-width row */}
        <div className="flex flex-col gap-2.5 px-8 pb-4 pt-2">
          {fields.name && infoRow(labels.name, member.name)}
          {fields.roll && member.roll && infoRow(labels.roll, member.roll)}
          {fields.session && member.session && infoRow(labels.session, member.session)}
          {fields.register && member.register && infoRow(labels.register, member.register)}
          {fields.department && member.department && infoRow(labels.department, member.department)}
          {fields.designation && member.designation && infoRow(labels.designation, member.designation)}
          {member.customFields
            ?.filter((cf) => cf.visible && (cf.id !== "rcy-dept" || fields.rcyDept))
            .map((cf) => (
              <div key={cf.id} className="flex w-full items-baseline">
                <span
                  className="flex-shrink-0 pr-2"
                  style={{
                    fontFamily: typography.labelFontFamily,
                    fontSize: `${Math.round(typography.labelFontSize * ps)}px`,
                    fontWeight: typography.labelFontWeight,
                    color: typography.labelColor,
                  }}
                >
                  {cf.id === "rcy-dept" ? labels.rcyDept : `${cf.label}:`}
                </span>
                <div
                  className="flex-1 truncate pb-0.5 pl-1 font-bold"
                  style={{
                    fontFamily: typography.valueFontFamily,
                    fontSize: `${Math.round(typography.valueFontSize * ps)}px`,
                    fontWeight: typography.valueFontWeight,
                    color: typography.valueColor,
                    borderBottom: `${typography.underlineThickness}px solid ${typography.underlineColor}`,
                  }}
                >
                  {cf.value}
                </div>
              </div>
            ))}
        </div>

        {/* Footer (compact: contacts are dropped so it fits the narrow portrait width) */}
        {footer.visible && (
          <div
            className="flex w-full items-center justify-between px-5"
            style={{
              backgroundColor: footer.bgColor,
              height: `${footer.height}px`,
              color: footer.textColor,
            }}
          >
            <div className="flex items-center gap-2.5">
              {footer.showLeftLogo && logos.footerLogoLeft.visible && (
                <div
                  className="flex-shrink-0"
                  style={{
                    width: `${Math.round(logos.footerLogoLeft.width * 0.8)}px`,
                    height: `${Math.round(logos.footerLogoLeft.height * 0.8)}px`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logos.footerLogoLeft.src}
                    alt="Footer RCY Logo"
                    className="h-full w-full object-contain"
                    crossOrigin="anonymous"
                    draggable={false}
                  />
                </div>
              )}
              <div className="flex flex-col text-left">
                <span
                  className="font-bold leading-tight"
                  style={{ fontSize: `${footer.orgNameFontSize}px`, color: footer.textColor }}
                >
                  {footer.orgName}
                </span>
                <span
                  className="leading-tight opacity-95"
                  style={{
                    fontSize: `${Math.round(footer.subtitleFontSize * ps)}px`,
                    color: footer.subtitleColor,
                  }}
                >
                  {footer.subtitle}
                </span>
              </div>
            </div>
            {footer.showRightLogo && logos.footerLogoRight.visible && (
              <div
                className="flex-shrink-0"
                style={{
                  width: `${Math.round(logos.footerLogoRight.width * 0.8)}px`,
                  height: `${Math.round(logos.footerLogoRight.height * 0.8)}px`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logos.footerLogoRight.src}
                  alt="Footer RPI Logo"
                  className="h-full w-full object-contain"
                  crossOrigin="anonymous"
                  draggable={false}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderPortraitBack() {
    return (
      <div
        className="flex h-full flex-col justify-between p-7"
        style={{ backgroundColor: backSide.bgColor, color: backSide.textColor }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logos.redCrescentLogo.src}
              alt="Logo"
              className="h-9 w-9 object-contain"
              crossOrigin="anonymous"
            />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-red-600">
                {header.orgTitle}
              </h3>
              <p className="text-[10px] font-medium text-slate-500">{header.instituteTitle}</p>
            </div>
          </div>
          {backSide.bloodGroupVisible && member.bloodGroup && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-center">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-red-600">
                Blood Group
              </span>
              <span className="text-base font-black leading-none text-red-700">
                {member.bloodGroup}
              </span>
            </div>
          )}
        </div>

        <div className="my-auto space-y-2 px-1 py-3">
          <h4 className="border-l-4 border-red-500 pl-2 text-sm font-bold uppercase tracking-wider text-slate-800">
            {backSide.title}
          </h4>
          <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-slate-600">
            {backSide.instructions.map((inst, idx) => (
              <li key={idx}>{inst}</li>
            ))}
          </ul>
          {backSide.emergencyContact && (
            <p className="pt-1 text-xs font-bold text-red-600">📞 {backSide.emergencyContact}</p>
          )}
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 pt-4">
          {backSide.showQrCode && resolveQrData(backSide.qrCodeData, member) && (
            <div className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div className="flex h-12 w-12 items-center justify-center rounded border border-slate-300 bg-white p-1">
                <QRCodeSVG
                  value={resolveQrData(backSide.qrCodeData, member)}
                  size={40}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#111827"
                />
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-bold uppercase text-slate-500">
                  Verify Membership
                </span>
                <span className="font-mono text-xs font-bold text-slate-800">
                  {member.idNumber || member.roll || "RCY-VALID"}
                </span>
              </div>
            </div>
          )}
          <div className="flex justify-center gap-8 text-center">
            <div>
              <div className="flex h-8 w-28 items-end justify-center border-b border-dashed border-slate-400 pb-1">
                {backSide.signatureImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={backSide.signatureImage}
                    alt="Signature"
                    className="max-h-6 max-w-full object-contain"
                  />
                )}
              </div>
              <span className="mt-1 block text-[11px] font-semibold text-slate-600">
                {backSide.issuedByTitle}
              </span>
            </div>
            <div>
              <div className="h-8 w-28 border-b border-dashed border-slate-400" />
              <span className="mt-1 block text-[11px] font-semibold text-slate-600">
                {backSide.authorizedSignatureTitle}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
      className={`select-none transition-transform duration-150 ease-out ${className}`}
    >
      <div
        id={id}
        data-card-root="true"
        style={{
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          backgroundColor: design.backgroundColor,
          backgroundImage: design.backgroundImage
            ? `url(${design.backgroundImage})`
            : design.backgroundGradient || undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: `${design.borderRadius}px`,
          border: `${design.borderWidth}px solid ${design.borderColor}`,
          boxShadow: design.shadow,
          fontFamily: typography.fontFamily,
          color: design.primaryTextColor,
        }}
        className="relative flex flex-col justify-between overflow-hidden"
      >
        {showGuides && (
          <div className="pointer-events-none absolute inset-0 z-50 export-exclude">
            <div className="pointer-events-none absolute inset-4 rounded-lg border border-dashed border-red-400/40" />
            <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-cyan-400/30" />
            <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-cyan-400/30" />
          </div>
        )}

        {/* ---------------- FRONT SIDE ---------------- */}
        {side === "front" ? (
          <>
            {/* Watermark layer (behind text and photo) */}
            {watermark.visible && watermark.src && (
              <div
                className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
                style={{
                  opacity: watermark.opacity,
                  transform: `translate(${watermark.x}px, ${watermark.y}px) rotate(${watermark.rotation}deg) scale(${watermark.scale})`,
                  mixBlendMode: watermark.blendMode,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={watermark.src}
                  alt=""
                  className="h-[540px] w-[540px] max-w-none object-contain"
                  crossOrigin="anonymous"
                  draggable={false}
                />
              </div>
            )}

            {/* Background image opacity overlay */}
            {design.backgroundImage && (
              <div
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                  backgroundColor: design.backgroundColor,
                  opacity: 1 - design.backgroundImageOpacity,
                }}
              />
            )}

            {/* Main content */}
            {isPortrait ? (
              renderPortraitFront()
            ) : (
            <div className="relative z-10 flex h-full flex-col justify-between">
              {/* TOP HEADER */}
              <div
                className="flex items-center justify-between px-7 pb-2 pt-4"
                style={{
                  marginTop: `${header.marginTop + layout.headerOffsetY}px`,
                  marginBottom: `${header.marginBottom}px`,
                  transform: `translateX(${header.x + layout.headerOffsetX}px) translateY(${header.y}px)`,
                }}
              >
                {logos.instituteLogo.visible && (
                  <div
                    className="flex-shrink-0"
                    style={{
                      width: `${logos.instituteLogo.width}px`,
                      height: `${logos.instituteLogo.height}px`,
                      opacity: logos.instituteLogo.opacity,
                      transform: `translate(${logos.instituteLogo.x}px, ${logos.instituteLogo.y}px) scale(${logos.instituteLogo.scale})`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logos.instituteLogo.src}
                      alt="Institute Logo"
                      className="h-full w-full object-contain"
                      crossOrigin="anonymous"
                      draggable={false}
                    />
                  </div>
                )}

                <div className="flex-1 px-2 text-center">
                  <h1
                    style={{
                      fontFamily: header.instituteTitleFont,
                      fontSize: `${header.instituteTitleSize}px`,
                      fontWeight: header.instituteTitleWeight,
                      fontStyle: header.instituteTitleStyle || "normal",
                      color: header.instituteTitleColor,
                      letterSpacing: `${header.instituteTitleTracking}px`,
                      lineHeight: 1.15,
                      // Keep the institute title on a single line on the card.
                      whiteSpace: "nowrap",
                    }}
                    className="uppercase"
                  >
                    {header.instituteTitle}
                  </h1>
                  <h2
                    style={{
                      fontFamily: header.orgTitleFont,
                      fontSize: `${header.orgTitleSize}px`,
                      fontWeight: header.orgTitleWeight,
                      fontStyle: header.orgTitleStyle || "normal",
                      color: header.orgTitleColor,
                      letterSpacing: `${header.orgTitleTracking}px`,
                      marginTop: `${header.lineSpacing}px`,
                      lineHeight: 1.15,
                      whiteSpace: "nowrap",
                    }}
                    className="uppercase"
                  >
                    {header.orgTitle}
                  </h2>
                </div>

                {logos.redCrescentLogo.visible && (
                  <div
                    className="flex-shrink-0"
                    style={{
                      width: `${logos.redCrescentLogo.width}px`,
                      height: `${logos.redCrescentLogo.height}px`,
                      opacity: logos.redCrescentLogo.opacity,
                      transform: `translate(${logos.redCrescentLogo.x}px, ${logos.redCrescentLogo.y}px) scale(${logos.redCrescentLogo.scale})`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logos.redCrescentLogo.src}
                      alt="Red Crescent Logo"
                      className="h-full w-full object-contain"
                      crossOrigin="anonymous"
                      draggable={false}
                    />
                  </div>
                )}
              </div>

              {/* MIDDLE: photo + member info */}
              <div className="flex flex-1 items-start gap-7 px-8 pb-3 pt-1">
                {/* Photo column */}
                <div
                  className="flex flex-shrink-0 flex-col items-center"
                  style={{
                    transform: `translate(${layout.photoOffsetX}px, ${layout.photoOffsetY}px)`,
                  }}
                >
                  {photo.visible && (
                    <div
                      className="relative overflow-hidden"
                      style={{
                        width: `${photo.width}px`,
                        height: `${photo.height}px`,
                        borderRadius: `${photo.borderRadius}px`,
                        border: photo.frameVisible
                          ? `${photo.borderWidth}px solid ${photo.borderColor}`
                          : "none",
                        boxShadow: photo.shadow
                          ? "0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -4px rgba(0, 0, 0, 0.2)"
                          : "none",
                        backgroundColor: "#f1f5f9",
                      }}
                    >
                      {photo.frameVisible && (
                        <div
                          className="pointer-events-none absolute inset-0 rounded-[inherit]"
                          style={{
                            boxShadow: `inset 0 0 0 ${photo.outerBorderWidth}px ${photo.outerBorderColor}`,
                          }}
                        />
                      )}
                      {hasPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.src}
                          alt={member.name || "Member"}
                          style={{
                            transform: `translate(${photo.x}px, ${photo.y}px) scale(${photo.scale}) rotate(${photo.rotate}deg)`,
                            transformOrigin: "center center",
                            objectFit: photo.objectFit,
                          }}
                          className="pointer-events-none block h-full w-full select-none"
                          crossOrigin="anonymous"
                          draggable={false}
                        />
                      ) : (
                        <span className="flex h-full w-full select-none items-center justify-center bg-gradient-to-br from-brand-soft to-brand/20 text-7xl font-bold text-brand/40">
                          {(member.name || "M").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Valid until under photo */}
                  {fields.validUntil && member.validUntil && (
                    <div
                      className="mt-3.5 flex w-full items-baseline justify-start gap-2 pl-1"
                      style={{
                        transform: `translate(${layout.validUntilOffsetX}px, ${layout.validUntilOffsetY}px)`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: typography.labelFontFamily,
                          fontSize: `${typography.labelFontSize}px`,
                          fontWeight: typography.labelFontWeight,
                          color: typography.labelColor,
                        }}
                      >
                        {labels.validUntil}
                      </span>
                      <span
                        className="min-w-[70px] border-b px-3 pb-0.5 text-center font-bold"
                        style={{
                          fontFamily: typography.valueFontFamily,
                          fontSize: `${typography.valueFontSize + 1}px`,
                          fontWeight: "700",
                          color: typography.valueColor,
                          borderColor: typography.underlineColor,
                          borderBottomWidth: `${typography.underlineThickness}px`,
                        }}
                      >
                        {member.validUntil}
                      </span>
                    </div>
                  )}
                </div>

                {/* Member info column */}
                <div
                  className="flex flex-1 flex-col justify-start space-y-4 pt-2"
                  style={{
                    transform: `translate(${layout.infoOffsetX}px, ${layout.infoOffsetY}px)`,
                  }}
                >
                  {fields.name && (
                    <div className="flex w-full items-baseline">
                      <span
                        className="flex-shrink-0 pr-3"
                        style={{
                          fontFamily: typography.labelFontFamily,
                          fontSize: `${typography.labelFontSize + 3}px`,
                          fontWeight: typography.labelFontWeight,
                          color: typography.labelColor,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {labels.name}
                      </span>
                      <div
                        className="flex-1 pb-0.5 pl-2 font-bold"
                        style={{
                          fontFamily: typography.valueFontFamily,
                          fontSize: `${typography.valueFontSize + 4}px`,
                          fontWeight: typography.valueFontWeight,
                          color: typography.valueColor,
                          borderBottom: `${typography.underlineThickness}px solid ${typography.underlineColor}`,
                        }}
                      >
                        {member.name || "—"}
                      </div>
                    </div>
                  )}

                  {(fields.roll || fields.session) &&
                    (member.roll || member.session) && (
                      <div className="flex w-full items-baseline gap-6">
                        {fields.roll && member.roll && (
                          <div className="flex min-w-0 flex-1 items-baseline">
                            <span
                              className="flex-shrink-0 pr-3"
                              style={{
                                fontFamily: typography.labelFontFamily,
                                fontSize: `${typography.labelFontSize}px`,
                                fontWeight: typography.labelFontWeight,
                                color: typography.labelColor,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {labels.roll}
                            </span>
                            <div
                              className="flex-1 truncate pb-0.5 pl-2 font-bold"
                              style={{
                                fontFamily: typography.valueFontFamily,
                                fontSize: `${typography.valueFontSize}px`,
                                fontWeight: typography.valueFontWeight,
                                color: typography.valueColor,
                                borderBottom: `${typography.underlineThickness}px solid ${typography.underlineColor}`,
                              }}
                            >
                              {member.roll}
                            </div>
                          </div>
                        )}
                        {fields.session && member.session && (
                          <div className="flex min-w-0 flex-1 items-baseline">
                            <span
                              className="flex-shrink-0 pr-3"
                              style={{
                                fontFamily: typography.labelFontFamily,
                                fontSize: `${typography.labelFontSize}px`,
                                fontWeight: typography.labelFontWeight,
                                color: typography.labelColor,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {labels.session}
                            </span>
                            <div
                              className="flex-1 truncate pb-0.5 pl-2 font-bold"
                              style={{
                                fontFamily: typography.valueFontFamily,
                                fontSize: `${typography.valueFontSize}px`,
                                fontWeight: typography.valueFontWeight,
                                color: typography.valueColor,
                                borderBottom: `${typography.underlineThickness}px solid ${typography.underlineColor}`,
                              }}
                            >
                              {member.session}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  {(fields.register || fields.department) &&
                    (member.register || member.department) && (
                      <div className="flex w-full items-baseline gap-6">
                        {fields.register && member.register && (
                          <div className="flex min-w-0 flex-1 items-baseline">
                            <span
                              className="flex-shrink-0 pr-3"
                              style={{
                                fontFamily: typography.labelFontFamily,
                                fontSize: `${typography.labelFontSize}px`,
                                fontWeight: typography.labelFontWeight,
                                color: typography.labelColor,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {labels.register}
                            </span>
                            <div
                              className="flex-1 truncate pb-0.5 pl-2 font-bold"
                              style={{
                                fontFamily: typography.valueFontFamily,
                                fontSize: `${typography.valueFontSize}px`,
                                fontWeight: typography.valueFontWeight,
                                color: typography.valueColor,
                                borderBottom: `${typography.underlineThickness}px solid ${typography.underlineColor}`,
                              }}
                            >
                              {member.register}
                            </div>
                          </div>
                        )}
                        {fields.department && member.department && (
                          <div className="flex min-w-0 flex-1 items-baseline">
                            <span
                              className="flex-shrink-0 pr-3"
                        style={{
                          fontFamily: typography.labelFontFamily,
                          fontSize: `${typography.labelFontSize - 1}px`,
                          fontWeight: typography.labelFontWeight,
                          color: typography.labelColor,
                          whiteSpace: "nowrap",
                        }}
                            >
                              {labels.department}
                            </span>
                            <div
                              className="flex-1 truncate pb-0.5 pl-1 text-xs font-medium"
                              style={{
                                fontFamily: typography.valueFontFamily,
                                fontSize: `${typography.valueFontSize - 2}px`,
                                fontWeight: "600",
                                color: typography.valueColor,
                                borderBottom: `${typography.underlineThickness}px solid ${typography.underlineColor}`,
                              }}
                            >
                              {member.department}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  {fields.designation && member.designation && (
                    <div className="flex w-full items-baseline">
                      <span
                        className="flex-shrink-0 pr-3"
                        style={{
                          fontFamily: typography.labelFontFamily,
                          fontSize: `${typography.labelFontSize - 0.5}px`,
                          fontWeight: typography.labelFontWeight,
                          color: typography.labelColor,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {labels.designation}
                      </span>
                      <div
                        className="flex-1 truncate pb-0.5 pl-2 font-bold"
                        style={{
                          fontFamily: typography.valueFontFamily,
                          fontSize: `${typography.valueFontSize}px`,
                          fontWeight: typography.valueFontWeight,
                          color: typography.valueColor,
                          borderBottom: `${typography.underlineThickness}px solid ${typography.underlineColor}`,
                        }}
                      >
                        {member.designation}
                      </div>
                    </div>
                  )}

                  {member.customFields
                    ?.filter((cf) => cf.visible && (cf.id !== "rcy-dept" || fields.rcyDept))
                    .map((cf) => (
                      <div key={cf.id} className="flex w-full items-baseline">
                        <span
                          className="flex-shrink-0 pr-3"
                          style={{
                            fontFamily: typography.labelFontFamily,
                            fontSize: `${typography.labelFontSize}px`,
                            fontWeight: typography.labelFontWeight,
                            color: typography.labelColor,
                          }}
                        >
                          {cf.id === "rcy-dept" ? labels.rcyDept : `${cf.label}:`}
                        </span>
                        <div
                          className="flex-1 pb-0.5 pl-2 font-bold"
                          style={{
                            fontFamily: typography.valueFontFamily,
                            fontSize: `${typography.valueFontSize}px`,
                            fontWeight: typography.valueFontWeight,
                            color: typography.valueColor,
                            borderBottom: `${typography.underlineThickness}px solid ${typography.underlineColor}`,
                          }}
                        >
                          {cf.value}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* BOTTOM FOOTER BAR */}
              {footer.visible && (
                <div
                  className="flex w-full items-center justify-between px-6"
                  style={{
                    backgroundColor: footer.bgColor,
                    height: `${footer.height}px`,
                    transform: `translateY(${footer.yOffset}px)`,
                    color: footer.textColor,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {footer.showLeftLogo && logos.footerLogoLeft.visible && (
                      <div
                        className="flex-shrink-0"
                        style={{
                          width: `${logos.footerLogoLeft.width}px`,
                          height: `${logos.footerLogoLeft.height}px`,
                          transform: `translate(${logos.footerLogoLeft.x}px, ${logos.footerLogoLeft.y}px) scale(${logos.footerLogoLeft.scale})`,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logos.footerLogoLeft.src}
                          alt="Footer RCY Logo"
                          className="h-full w-full object-contain"
                          crossOrigin="anonymous"
                          draggable={false}
                        />
                      </div>
                    )}
                    <div className="flex flex-col text-left">
                      <span
                        className="font-bold leading-tight"
                        style={{
                          fontSize: `${footer.orgNameFontSize}px`,
                          color: footer.textColor,
                        }}
                      >
                        {footer.orgName}
                      </span>
                      <span
                        className="leading-tight opacity-95"
                        style={{
                          fontSize: `${footer.subtitleFontSize}px`,
                          color: footer.subtitleColor,
                        }}
                      >
                        {footer.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    {footer.contacts
                      .filter((c) => c.visible)
                      .map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center gap-1.5 whitespace-nowrap"
                          style={{
                            fontSize: `${footer.fontSize}px`,
                            color: footer.contactColor,
                          }}
                        >
                          {renderContactIcon(contact.type)}
                          <span className="font-semibold tracking-tight">
                            {contact.value}
                          </span>
                        </div>
                      ))}
                  </div>

                  {footer.showRightLogo && logos.footerLogoRight.visible && (
                    <div
                      className="flex-shrink-0"
                      style={{
                        width: `${logos.footerLogoRight.width}px`,
                        height: `${logos.footerLogoRight.height}px`,
                        transform: `translate(${logos.footerLogoRight.x}px, ${logos.footerLogoRight.y}px) scale(${logos.footerLogoRight.scale})`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logos.footerLogoRight.src}
                        alt="Footer RPI Logo"
                        className="h-full w-full object-contain"
                        crossOrigin="anonymous"
                        draggable={false}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
          </>
        ) : isPortrait ? (
          renderPortraitBack()
        ) : (
          /* ---------------- BACK SIDE ---------------- */
          <div
            className="flex h-full flex-col justify-between p-8"
            style={{
              backgroundColor: backSide.bgColor,
              color: backSide.textColor,
            }}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logos.redCrescentLogo.src}
                  alt="Logo"
                  className="h-12 w-12 object-contain"
                  crossOrigin="anonymous"
                />
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-wide text-red-600">
                    {header.orgTitle}
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    {header.instituteTitle}
                  </p>
                </div>
              </div>
              {backSide.bloodGroupVisible && member.bloodGroup && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-center">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-red-600">
                    Blood Group
                  </span>
                  <span className="text-lg font-black leading-none text-red-700">
                    {member.bloodGroup}
                  </span>
                </div>
              )}
            </div>

            <div className="my-auto space-y-2 px-2 py-3">
              <h4 className="border-l-4 border-red-500 pl-2 text-sm font-bold uppercase tracking-wider text-slate-800">
                {backSide.title}
              </h4>
              <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-slate-600">
                {backSide.instructions.map((inst, idx) => (
                  <li key={idx}>{inst}</li>
                ))}
              </ul>
              {backSide.emergencyContact && (
                <p className="pt-1 text-xs font-bold text-red-600">
                  📞 {backSide.emergencyContact}
                </p>
              )}
            </div>

            <div className="flex items-end justify-between border-t border-slate-200 pt-4">
              {backSide.showQrCode && resolveQrData(backSide.qrCodeData, member) && (
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded border border-slate-300 bg-white p-1">
                    <QRCodeSVG
                      value={resolveQrData(backSide.qrCodeData, member)}
                      size={48}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#111827"
                    />
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] font-bold uppercase text-slate-500">
                      Verify Membership
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {member.idNumber || member.roll || "RCY-VALID"}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-10 text-center">
                <div>
                  <div className="flex h-9 w-32 items-end justify-center border-b border-dashed border-slate-400 pb-1">
                    {backSide.signatureImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={backSide.signatureImage}
                        alt="Signature"
                        className="max-h-8 max-w-full object-contain"
                      />
                    )}
                  </div>
                  <span className="mt-1 block text-[11px] font-semibold text-slate-600">
                    {backSide.issuedByTitle}
                  </span>
                </div>
                <div>
                  <div className="h-9 w-32 border-b border-dashed border-slate-400" />
                  <span className="mt-1 block text-[11px] font-semibold text-slate-600">
                    {backSide.authorizedSignatureTitle}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
