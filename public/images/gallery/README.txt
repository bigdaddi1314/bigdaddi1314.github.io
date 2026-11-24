Maison 704 — Real Product Photo Drop Folder
===========================================

Drop your background-edited real photos (.webp, .jpg, .jpeg, or .png) into this
folder (or into public/images/products/) and run:

    npm run sync-photos

Filename matching examples (any of these work):
  - By catalog product ID / slug:
      carryall-tote.webp
      herb-grinder.jpg
      lightbox.png
      elglock-bic-sleeve.webp
      wall-logo.jpg
      erotic-label-ashtray-cup.webp
      lips-floating-shelf.jpg
      cashapp-pay-wand.webp
      rolling-tray.jpg
      heart-clutch.webp
  - Or by gallery slot ID:
      slot-01.webp  through  slot-10.webp

Running `npm run sync-photos` automatically:
  1. Updates `realPhotoUrl` in src/components/MadeInAtelierGallery.tsx
  2. Updates `image` and `photoStatus` in public/products-catalog.json & public/products-catalog.js
  3. Runs `npm run build` so the live 24/7 server on port 5174 serves the new photos immediately
  4. Prints a progress summary of real photos vs. remaining 3D renders
