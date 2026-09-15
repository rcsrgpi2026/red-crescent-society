import React from "react";

interface AssistantBotIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  primaryColor?: string;
  wireColor?: string;
  eyeColor?: string;
}

export function AssistantBotIcon({
  className = "h-6 w-6",
  primaryColor = "#e11d48", // Red Crescent Red
  wireColor = "#cbd5e1",    // Light slate / white accent wire
  eyeColor = "#ffffff",     // White eyes
  ...props
}: AssistantBotIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Outer Headband Arch */}
      <path
        d="M 4 14.5 C 4 7.2 9.4 3.5 16 3.5 C 22.6 3.5 28 7.2 28 14.5"
        stroke={primaryColor}
        strokeWidth="2.75"
        strokeLinecap="round"
      />

      {/* Microphone Boom Wire (Arches around and under the chin) */}
      <path
        d="M 6.5 16 C 6.5 9.5 10.5 6 16 6 C 22 6 26 9.8 26 16.5 C 26 23 21 27.2 16 27.2 L 14.5 27.2"
        stroke={wireColor}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Left Headphone Ear Cushion */}
      <rect
        x="2"
        y="11"
        width="4"
        height="9"
        rx="2"
        fill={primaryColor}
      />

      {/* Right Headphone Ear Cushion */}
      <rect
        x="26"
        y="11"
        width="4"
        height="9"
        rx="2"
        fill={primaryColor}
      />

      {/* Bot Visor / Face with Chamfered Corners */}
      <path
        d="M 10 9.5 L 22 9.5 C 23.8 9.5 25.2 10.8 25.2 12.6 L 25.2 18 C 25.2 20 23.6 21.6 21.6 21.6 L 10.4 21.6 C 8.4 21.6 6.8 20 6.8 18 L 6.8 12.6 C 6.8 10.8 8.2 9.5 10 9.5 Z"
        fill={primaryColor}
      />

      {/* Eyes */}
      <circle cx="11.8" cy="15.6" r="2.1" fill={eyeColor} />
      <circle cx="20.2" cy="15.6" r="2.1" fill={eyeColor} />

      {/* Microphone Mouthpiece */}
      <rect
        x="13.5"
        y="25.6"
        width="5"
        height="3.2"
        rx="1.6"
        fill={primaryColor}
      />
    </svg>
  );
}
