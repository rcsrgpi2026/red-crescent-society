/**
 * Loads the font families offered by the ID card typography settings. The card
 * references them by plain CSS family name, so they are loaded from Google
 * Fonts (not next/font, which renames families to hashed identifiers).
 * Rendered wherever a card appears — browsers dedupe repeated <link> tags.
 */
export function CardFonts() {
  return (
    <link
      rel="stylesheet"
      crossOrigin="anonymous"
      href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto+Condensed:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Bebas+Neue&family=Saira+Condensed:wght@400;500;600;700&family=Archivo+Black&family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700&family=Poppins:wght@400;500;600;700;800&family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700&family=Outfit:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap"
    />
  );
}
