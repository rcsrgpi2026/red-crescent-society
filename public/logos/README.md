# Official Logos

The site renders two logos:

- `rcr-logo.svg` — Rajshahi Polytechnic Institute **Red Crescent Society** logo (used in the header, footer, login page, membership card and admin).
- `rpi-logo.svg` — Rajshahi Polytechnic Institute logo (used as the secondary identity in the header/footer).

## Two ways to set them

1. **From the admin panel (recommended).** Go to **Admin → Settings → Site logos**, upload each logo, crop it to the square frame and save. The cropped logo is stored in the public `logos` storage bucket, compressed as WebP, and replaces the placeholder everywhere on the site — no code or file changes needed.
2. **Manually.** Replace the placeholder `.svg` files in this folder. The current files are clearly-labeled placeholders so the site works out of the box (SVG or PNG — if you use PNG, update the file references in `components/layout/site-logo.tsx`).

A logo uploaded from the admin always takes precedence over the static files in this folder.

The logos are always rendered with their original aspect ratio — never stretched, recolored, or restyled by the code.
