# Image credits and approval status

Every image shipped in `public/img/` must be listed here with its origin and the
owner's approval. Google Maps photos are user-uploaded and copyrighted: do not
ship any until the owner (ideally the photographer) has approved them, and
prefer originals sent directly by the owner.

| File (source) | Depicts | Origin | Approval |
|---|---|---|---|
| hero-poster.png | Copper tray of saffron rice with a roasted chicken quarter | Rendered from the site's own procedural Three.js scene (`npm run poster`). Not a photograph. | n/a (generated) |
| og-source.png | Hero composition at 1200×630 for link previews | Rendered from the site (`npm run poster`) | n/a (generated) |

## Pending

No owner-approved photographs have been received yet. When they arrive:

1. Copy originals into `assets/img/source/` (keep the original filenames).
2. Add a row above with the photographer/source and the owner's written approval.
3. Add an entry to `assets/img/source/manifest.json` with a meaningful `alt`.
4. Run `npm run images`, then reference the ids in `src/content/site.json`
   (`gallery.images`, and `image` on signature menu items).

## Preview-only (NOT approved)

| File (source) | Depicts | Origin | Approval |
|---|---|---|---|
| storefront.jpg | Night view of the storefront and sign | Google Maps listing photo, user-uploaded (Feb 2026), pulled 2026-09-29 for the owner preview | **Pending.** Remove or replace with the owner's original before public launch. |
