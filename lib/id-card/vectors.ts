// Vector assets for the Rajshahi Govt Polytechnic Institute - Red Crescent
// Youth ID card. Ported from the standalone ID card builder.

/**
 * High-precision SVG for Rajshahi Govt. Polytechnic Institute Logo
 * Red outer gear wheel with Bengali inscription, blue gear/circuit center, green foliage base
 */
export const RPI_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <path id="textCircle" d="M 30,100 A 70,70 0 1,1 170,100" />
  </defs>
  <!-- Outer Gear teeth -->
  <g fill="%23d32f2f">
    <circle cx="100" cy="100" r="92" stroke="%23d32f2f" stroke-width="6"/>
    <!-- Gear cogs -->
    <path d="M92 4 h16 v16 h-16 z" />
    <path d="M92 180 h16 v16 h-16 z" />
    <path d="M4 92 h16 v16 h-16 z" />
    <path d="M180 92 h16 v16 h-16 z" />
    <path d="M32 32 l12 12 l-12 12 l-12 -12 z" />
    <path d="M156 32 l12 12 l-12 12 l-12 -12 z" />
    <path d="M32 156 l12 12 l-12 12 l-12 -12 z" />
    <path d="M156 156 l12 12 l-12 12 l-12 -12 z" />
    <!-- Additional cog teeth -->
    <path d="M60 12 h14 v14 h-14 z" />
    <path d="M126 12 h14 v14 h-14 z" />
    <path d="M12 60 h14 v14 h-14 z" />
    <path d="M12 126 h14 v14 h-14 z" />
    <path d="M174 60 h14 v14 h-14 z" />
    <path d="M174 126 h14 v14 h-14 z" />
    <path d="M60 174 h14 v14 h-14 z" />
    <path d="M126 174 h14 v14 h-14 z" />
  </g>
  <!-- Inner White Ring -->
  <circle cx="100" cy="100" r="74" fill="%23ffffff" />
  <circle cx="100" cy="100" r="72" fill="none" stroke="%23d32f2f" stroke-width="2"/>
  
  <!-- Arch Bengali Text -->
  <text font-family="'Hind Siliguri', 'Noto Sans Bengali', sans-serif" font-size="12" font-weight="bold" fill="%23d32f2f" text-anchor="middle">
    <textPath href="%23textCircle" startOffset="50%">
      রাজশাহী পলিটেকনিক ইনস্টিটিউট
    </textPath>
  </text>
  
  <!-- Center Blue Shield / Circuit / Cog -->
  <circle cx="100" cy="100" r="48" fill="%230288d1" />
  <path d="M78 80 L100 60 L122 80 L122 120 L78 120 Z" fill="%23ffffff" />
  <!-- Circuit tracks -->
  <path d="M100 66 L100 115 M86 86 L100 100 M114 86 L100 100" stroke="%230288d1" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="86" cy="86" r="4" fill="%230288d1" />
  <circle cx="114" cy="86" r="4" fill="%230288d1" />
  <circle cx="100" cy="66" r="4" fill="%230288d1" />
  
  <!-- Bottom Green Leaves / Base -->
  <path d="M48 140 C 70 115, 100 135, 100 162 C 100 135, 130 115, 152 140 C 135 168, 65 168, 48 140 Z" fill="%232e7d32" />
  <path d="M100 125 L100 162" stroke="%23ffffff" stroke-width="2" />
</svg>`;

/**
 * High-precision SVG for Red Crescent Youth circular badge
 * Outer black text ring "RAJSHAHI GOVT. POLYTECHNIC INSTITUTE RED CRESCENT YOUTH",
 * Green ring with BDRCS and stars, center white circle with red crescent moon
 */
export const RCY_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <path id="rcyTopRing" d="M 24,100 A 76,76 0 1,1 176,100" />
    <path id="rcyBottomRing" d="M 176,100 A 76,76 0 0,1 24,100" />
    <path id="rcyGreenTop" d="M 40,100 A 60,60 0 1,1 160,100" />
    <path id="rcyGreenBottom" d="M 160,100 A 60,60 0 0,1 40,100" />
  </defs>
  
  <!-- Outer Double Black Border Ring -->
  <circle cx="100" cy="100" r="97" fill="%23ffffff" stroke="%23111827" stroke-width="4"/>
  <circle cx="100" cy="100" r="76" fill="%23ffffff" stroke="%23111827" stroke-width="2"/>
  
  <!-- Outer Ring Text -->
  <text font-family="'Oswald', 'Arial Black', sans-serif" font-size="10.5" font-weight="900" fill="%23111827" letter-spacing="0.5">
    <textPath href="%23rcyTopRing" startOffset="50%" text-anchor="middle">
      RAJSHAHI GOVT. POLYTECHNIC INSTITUTE
    </textPath>
  </text>
  <text font-family="'Oswald', 'Arial Black', sans-serif" font-size="11.5" font-weight="900" fill="%23111827" letter-spacing="1">
    <textPath href="%23rcyBottomRing" startOffset="50%" text-anchor="middle">
      RED CRESCENT YOUTH
    </textPath>
  </text>
  
  <!-- Middle Green Ring -->
  <circle cx="100" cy="100" r="68" fill="%23008044" />
  
  <!-- Green Ring Inner Inscription -->
  <text font-family="'Arial', sans-serif" font-size="7" font-weight="bold" fill="%23ffffff" letter-spacing="1.5">
    <textPath href="%23rcyGreenBottom" startOffset="50%" text-anchor="middle">
      ★ BDRCS ★
    </textPath>
  </text>
  
  <!-- Center White Circle -->
  <circle cx="100" cy="100" r="50" fill="%23ffffff" stroke="%23008044" stroke-width="1.5"/>
  
  <!-- Red Crescent Moon in Center -->
  <path d="M 88,62 A 38,38 0 1 0 128,124 A 31,31 0 1 1 88,62 Z" fill="%23e00613" />
</svg>`;

/**
 * High-precision Watermark SVG
 * Bangladesh Red Crescent Society circular watermark with tilted text ring and crescent symbol
 */
export const WATERMARK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <defs>
    <path id="wmTopRing" d="M 80,300 A 220,220 0 1,1 520,300" />
    <path id="wmBottomRing" d="M 520,300 A 220,220 0 0,1 80,300" />
    <path id="wmMidRing" d="M 120,300 A 180,180 0 1,1 480,300" />
  </defs>
  
  <!-- Outer Double Watermark Ring -->
  <circle cx="300" cy="300" r="280" fill="none" stroke="%2322c55e" stroke-width="12" opacity="0.8"/>
  <circle cx="300" cy="300" r="260" fill="none" stroke="%2322c55e" stroke-width="4" opacity="0.8"/>
  <circle cx="300" cy="300" r="180" fill="none" stroke="%2322c55e" stroke-width="6" opacity="0.8"/>
  
  <!-- Outer Ring Text (Bangladesh Red Crescent Society) -->
  <text font-family="'Oswald', 'Montserrat', sans-serif" font-size="34" font-weight="900" fill="%2316a34a" letter-spacing="4">
    <textPath href="%23wmTopRing" startOffset="50%" text-anchor="middle">
      RAJSHAHI RED CRESCENT
    </textPath>
  </text>
  
  <!-- Bottom Text: BDRCS -->
  <text font-family="'Oswald', 'Montserrat', sans-serif" font-size="52" font-weight="900" fill="%2316a34a" letter-spacing="8">
    <textPath href="%23wmBottomRing" startOffset="50%" text-anchor="middle">
      BDRCS
    </textPath>
  </text>
  
  <!-- Center Red Crescent Moon -->
  <circle cx="300" cy="300" r="160" fill="%23ffffff" opacity="0.4"/>
  <path d="M 270,170 A 130,130 0 1 0 400,370 A 105,105 0 1 1 270,170 Z" fill="%23ef4444" opacity="0.85"/>
</svg>`;
