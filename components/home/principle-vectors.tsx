import React from "react";

// -------------------------------------------------------------
// 7 FUNDAMENTAL PRINCIPLES VECTOR ILLUSTRATIONS
// -------------------------------------------------------------

/**
 * 01 - HUMANITY: Hands cradling a radiant heart with healing cross.
 */
export function VectorHumanity({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="humGlow" cx="60" cy="55" r="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f43f5e" stopOpacity="0.25" />
          <stop offset="1" stopColor="#f43f5e" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Ambient background glow circle */}
      <circle cx="60" cy="55" r="46" fill="url(#humGlow)" />
      {/* Radiant burst rays */}
      <g stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" opacity="0.6">
        <line x1="60" y1="12" x2="60" y2="20" />
        <line x1="88" y1="24" x2="82" y2="30" />
        <line x1="32" y1="24" x2="38" y2="30" />
        <line x1="98" y1="52" x2="90" y2="52" />
        <line x1="22" y1="52" x2="30" y2="52" />
      </g>
      {/* Supporting Hands Sheltering From Below */}
      <path
        d="M24 78 C28 66 38 62 48 66 C54 68 58 73 60 75 C62 73 66 68 72 66 C82 62 92 66 96 78 C100 86 92 98 60 106 C28 98 20 86 24 78 Z"
        fill="#fda4af"
        stroke="#f43f5e"
        strokeWidth="1.5"
      />
      {/* Central Heart */}
      <path
        d="M60 74 C50 64 34 50 34 38 C34 29 41 22 50 22 C55 22 60 25 60 28 C60 25 65 22 70 22 C79 22 86 29 86 38 C86 50 70 64 60 74 Z"
        fill="#e11d48"
        stroke="#be123c"
        strokeWidth="1.5"
      />
      {/* First Aid Cross inside heart */}
      <path
        d="M57 32 H63 V38 H69 V44 H63 V50 H57 V44 H51 V38 H57 Z"
        fill="#ffffff"
      />
      {/* Hand wrist detail line */}
      <path
        d="M36 94 C46 101 54 103 60 104 C66 103 74 101 84 94"
        stroke="#e11d48"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

/**
 * 02 - IMPARTIALITY: Perfectly balanced scales of justice with equal weights.
 */
export function VectorImpartiality({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="impGlow" cx="60" cy="55" r="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Glow */}
      <circle cx="60" cy="55" r="46" fill="url(#impGlow)" />
      {/* Central Pillar & Base */}
      <path d="M58 24 H62 V90 H58 Z" fill="#4f46e5" />
      <path d="M42 96 C42 91 50 90 60 90 C70 90 78 91 78 96 H42 Z" fill="#3730a3" />
      {/* Top Pivot Finial */}
      <circle cx="60" cy="22" r="5" fill="#4338ca" />
      <circle cx="60" cy="22" r="2.5" fill="#ffffff" />
      {/* Perfectly Level Horizontal Beam */}
      <rect x="22" y="34" width="76" height="5" rx="2.5" fill="#4f46e5" />
      {/* Central Fulcrum Indicator */}
      <polygon points="60,39 56,47 64,47" fill="#4338ca" />
      {/* Left Pan Chains & Bowl */}
      <g>
        <line x1="26" y1="39" x2="16" y2="66" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="26" y1="39" x2="36" y2="66" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M14 66 C14 77 38 77 38 66 Z" fill="#4f46e5" />
        {/* Equal weight orbs inside pan */}
        <circle cx="23" cy="62" r="3.5" fill="#38bdf8" />
        <circle cx="29" cy="62" r="3.5" fill="#f43f5e" />
      </g>
      {/* Right Pan Chains & Bowl */}
      <g>
        <line x1="94" y1="39" x2="84" y2="66" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="94" y1="39" x2="104" y2="66" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M82 66 C82 77 106 77 106 66 Z" fill="#4f46e5" />
        {/* Equal weight orbs inside pan */}
        <circle cx="91" cy="62" r="3.5" fill="#10b981" />
        <circle cx="97" cy="62" r="3.5" fill="#f59e0b" />
      </g>
      {/* Equilibrium Sparkle */}
      <circle cx="60" cy="14" r="2" fill="#818cf8" />
    </svg>
  );
}

/**
 * 03 - NEUTRALITY: Protective peace shield with olive branch.
 */
export function VectorNeutrality({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="neuGlow" cx="60" cy="55" r="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" stopOpacity="0.25" />
          <stop offset="1" stopColor="#14b8a6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="55" r="46" fill="url(#neuGlow)" />
      {/* Outer Shield Outline */}
      <path
        d="M60 16 L88 28 C88 64 76 86 60 98 C44 86 32 64 32 28 Z"
        fill="#0f766e"
        stroke="#2dd4bf"
        strokeWidth="2.5"
      />
      {/* Inner Inset Shield */}
      <path
        d="M60 24 L82 34 C82 62 72 80 60 90 C48 80 38 62 38 34 Z"
        fill="#ffffff"
        opacity="0.12"
      />
      {/* Olive Branch / Dove Feather Motif inside */}
      <path
        d="M60 36 V76"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Paired Leaves */}
      <path d="M60 44 C67 42 72 46 72 46 C72 46 68 51 60 48" fill="#5eead4" />
      <path d="M60 44 C53 42 48 46 48 46 C48 46 52 51 60 48" fill="#5eead4" />
      <path d="M60 56 C67 54 72 58 72 58 C72 58 68 63 60 60" fill="#5eead4" />
      <path d="M60 56 C53 54 48 58 48 58 C48 58 52 63 60 60" fill="#5eead4" />
      <circle cx="60" cy="34" r="3.5" fill="#ffffff" />
    </svg>
  );
}

/**
 * 04 - INDEPENDENCE: 8-point navigational compass star and autonomous helm.
 */
export function VectorIndependence({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="indGlow" cx="60" cy="60" r="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b" stopOpacity="0.3" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="indNorth" x1="60" y1="18" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="46" fill="url(#indGlow)" />
      {/* Outer Dial Ring */}
      <circle cx="60" cy="60" r="38" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 3" opacity="0.6" />
      <circle cx="60" cy="60" r="43" stroke="#d97706" strokeWidth="1" opacity="0.4" />
      {/* Compass Star Points - Secondary 45 deg */}
      <g opacity="0.6">
        <polygon points="60,60 76,44 60,54" fill="#fbbf24" />
        <polygon points="60,60 76,44 66,60" fill="#d97706" />
        <polygon points="60,60 76,76 66,60" fill="#fbbf24" />
        <polygon points="60,60 76,76 60,66" fill="#d97706" />
        <polygon points="60,60 44,76 60,66" fill="#fbbf24" />
        <polygon points="60,60 44,76 54,60" fill="#d97706" />
        <polygon points="60,60 44,44 54,60" fill="#fbbf24" />
        <polygon points="60,60 44,44 60,54" fill="#d97706" />
      </g>
      {/* Main Cardinal Points */}
      {/* North */}
      <polygon points="60,60 60,18 54,60" fill="#f59e0b" />
      <polygon points="60,60 60,18 66,60" fill="#b45309" />
      {/* South */}
      <polygon points="60,60 60,102 66,60" fill="#f59e0b" />
      <polygon points="60,60 60,102 54,60" fill="#b45309" />
      {/* East */}
      <polygon points="60,60 102,60 60,54" fill="#f59e0b" />
      <polygon points="60,60 102,60 60,66" fill="#b45309" />
      {/* West */}
      <polygon points="60,60 18,60 60,66" fill="#f59e0b" />
      <polygon points="60,60 18,60 60,54" fill="#b45309" />
      {/* Center Pivot */}
      <circle cx="60" cy="60" r="6" fill="#ffffff" stroke="#b45309" strokeWidth="2" />
      <circle cx="60" cy="60" r="2.5" fill="#f59e0b" />
    </svg>
  );
}

/**
 * 05 - VOLUNTARY SERVICE: Giving hands offering sparkling heart gift.
 */
export function VectorVoluntary({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="volGlow" cx="60" cy="55" r="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a855f7" stopOpacity="0.25" />
          <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="55" r="46" fill="url(#volGlow)" />
      {/* Floating Gift Heart */}
      <path
        d="M60 48 C53 40 40 30 40 20 C40 13 46 8 53 8 C57 8 60 10 60 13 C60 10 63 8 67 8 C74 8 80 13 80 20 C80 30 67 40 60 48 Z"
        fill="#ec4899"
      />
      {/* Sparkles around heart */}
      <path d="M42 12 L44 8 L46 12 L50 14 L46 16 L44 20 L42 16 L38 14 Z" fill="#fbbf24" />
      <path d="M74 24 L75.5 20 L77 24 L81 25.5 L77 27 L75.5 31 L74 27 L70 25.5 Z" fill="#fbbf24" />
      {/* Generous open hand beneath */}
      <path
        d="M26 84 C34 76 44 72 56 74 L78 78 C86 80 92 76 96 72 C98 70 100 72 98 75 C94 82 86 90 76 92 L54 94 C44 95 32 92 24 88 Z"
        fill="#9333ea"
      />
      {/* Supporting wrist / sleeve */}
      <path
        d="M18 86 C24 84 30 85 36 88 L34 102 C26 99 20 94 18 86 Z"
        fill="#6b21a8"
      />
    </svg>
  );
}

/**
 * 06 - UNITY: Interlocking circular ring of team members united as one.
 */
export function VectorUnity({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="uniGlow" cx="60" cy="60" r="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0284c7" stopOpacity="0.3" />
          <stop offset="1" stopColor="#0284c7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="46" fill="url(#uniGlow)" />
      {/* Central Solidarity Ring */}
      <circle cx="60" cy="60" r="22" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 4" />
      <circle cx="60" cy="60" r="10" fill="#38bdf8" opacity="0.8" />
      {/* 3 United Figures in Circle */}
      {/* Figure Top */}
      <g transform="translate(60, 26)">
        <circle cx="0" cy="0" r="7" fill="#0284c7" />
        <path d="M-12 18 C-12 11 -6 9 0 9 C6 9 12 11 12 18 Z" fill="#0284c7" />
      </g>
      {/* Figure Bottom-Left */}
      <g transform="translate(32, 78)">
        <circle cx="0" cy="0" r="7" fill="#0369a1" />
        <path d="M-12 18 C-12 11 -6 9 0 9 C6 9 12 11 12 18 Z" fill="#0369a1" />
      </g>
      {/* Figure Bottom-Right */}
      <g transform="translate(88, 78)">
        <circle cx="0" cy="0" r="7" fill="#0ea5e9" />
        <path d="M-12 18 C-12 11 -6 9 0 9 C6 9 12 11 12 18 Z" fill="#0ea5e9" />
      </g>
      {/* Joining Arms / Bridge Arc */}
      <path
        d="M48 40 C38 52 38 68 44 76 M76 76 C82 68 82 52 72 40 M46 86 C60 92 60 92 74 86"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * 07 - UNIVERSALITY: Globe encircled by international humanitarian band.
 */
export function VectorUniversality({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="univGlow" cx="60" cy="60" r="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#059669" stopOpacity="0.25" />
          <stop offset="1" stopColor="#059669" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="46" fill="url(#univGlow)" />
      {/* Planet Sphere */}
      <circle cx="60" cy="60" r="34" fill="#059669" />
      {/* Longitude & Latitude Curved Grids */}
      <ellipse cx="60" cy="60" rx="17" ry="34" stroke="#ffffff" strokeWidth="1.6" opacity="0.5" />
      <line x1="26" y1="60" x2="94" y2="60" stroke="#ffffff" strokeWidth="1.6" opacity="0.5" />
      <ellipse cx="60" cy="45" rx="30" ry="10" stroke="#ffffff" strokeWidth="1.2" opacity="0.4" />
      <ellipse cx="60" cy="75" rx="30" ry="10" stroke="#ffffff" strokeWidth="1.2" opacity="0.4" />
      {/* Orbiting Red Crescent Ribbon */}
      <path
        d="M20 72 C35 96 85 96 100 48 C106 30 85 24 68 28"
        stroke="#ef4444"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="100" cy="48" r="4" fill="#ef4444" />
    </svg>
  );
}

// -------------------------------------------------------------
// ABOUT CARDS VECTOR ILLUSTRATIONS (Mission, Vision, etc.)
// -------------------------------------------------------------

/**
 * MISSION: Precision Target Reticle & Heart Arrow.
 */
export function VectorMission({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="misGlow" cx="60" cy="60" r="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#dc2626" stopOpacity="0.3" />
          <stop offset="1" stopColor="#dc2626" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="46" fill="url(#misGlow)" />
      {/* Concentric Target Rings */}
      <circle cx="60" cy="60" r="38" stroke="#dc2626" strokeWidth="2" strokeDasharray="6 4" opacity="0.4" />
      <circle cx="60" cy="60" r="28" fill="#fee2e2" stroke="#dc2626" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="16" fill="#ef4444" />
      <circle cx="60" cy="60" r="6" fill="#ffffff" />
      {/* Crosshair Marks */}
      <line x1="60" y1="16" x2="60" y2="28" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="92" x2="60" y2="104" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="60" x2="28" y2="60" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
      <line x1="92" y1="60" x2="104" y2="60" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * VISION: Radiant Insight Eye Prism & Forward Beacon.
 */
export function VectorVision({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="visGlow" cx="60" cy="60" r="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0284c7" stopOpacity="0.3" />
          <stop offset="1" stopColor="#0284c7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="46" fill="url(#visGlow)" />
      {/* Beacon Rays */}
      <path d="M60 20 L60 28 M84 32 L78 38 M36 32 L42 38 M98 60 L88 60 M22 60 L32 60" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      {/* Vision Eye Shape */}
      <path
        d="M20 60 C36 38 84 38 100 60 C84 82 36 82 20 60 Z"
        fill="#e0f2fe"
        stroke="#0284c7"
        strokeWidth="3.5"
      />
      {/* Iris & Pupil */}
      <circle cx="60" cy="60" r="16" fill="#0284c7" />
      <circle cx="60" cy="60" r="8" fill="#0369a1" />
      <circle cx="63" cy="57" r="3.5" fill="#ffffff" />
    </svg>
  );
}

/**
 * ACTIONS: First Aid & Blood Support Responder Gear.
 */
export function VectorActions({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="actGlow" cx="60" cy="60" r="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0d9488" stopOpacity="0.3" />
          <stop offset="1" stopColor="#0d9488" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="46" fill="url(#actGlow)" />
      {/* Blood Support Droplet with Pulse Wave */}
      <path
        d="M60 18 C60 18 36 50 36 68 C36 82 47 92 60 92 C73 92 84 82 84 68 C84 50 60 18 60 18 Z"
        fill="#e11d48"
      />
      {/* Heartbeat Line inside */}
      <path
        d="M44 68 H52 L56 60 L62 76 L66 65 L70 68 H76"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Green First Aid Kit Badge floating */}
      <g transform="translate(74, 68)">
        <rect width="26" height="22" rx="5" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
        <path d="M8 0 H18 V-4 H8 Z" fill="#0f766e" />
        <path d="M11 6 H15 V16 H11 Z M8 9 H18 V13 H8 Z" fill="#ffffff" />
      </g>
    </svg>
  );
}

/**
 * HERITAGE: Vintage 2020 Scroll & Milestone Hourglass.
 */
export function VectorHeritage({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="herGlow" cx="60" cy="60" r="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d97706" stopOpacity="0.3" />
          <stop offset="1" stopColor="#d97706" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="46" fill="url(#herGlow)" />
      {/* Clock / Compass Housing */}
      <circle cx="60" cy="60" r="36" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />
      <circle cx="60" cy="60" r="28" stroke="#b45309" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Clock Hands indicating Time Passage */}
      <line x1="60" y1="60" x2="60" y2="40" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="60" y1="60" x2="74" y2="60" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="60" cy="60" r="4" fill="#d97706" />
      {/* Year Banner Badge: 2020 */}
      <g transform="translate(34, 82)">
        <rect width="52" height="18" rx="9" fill="#d97706" />
        <text x="26" y="13" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          EST. 2020
        </text>
      </g>
    </svg>
  );
}
