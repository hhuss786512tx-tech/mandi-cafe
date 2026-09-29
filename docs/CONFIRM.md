# Open items to confirm with the owner

Generated from `src/content/site.json` on 2026-09-29. Each item is a field with
`"confirmed": false`; set the value, flip the flag, rebuild.

1. **`nameArabic`** — Only the word 'mandi' (مندي) is shown as a typographic accent. Confirm the full Arabic spelling of the restaurant name with the owner before extending it.
2. **`siteUrl`** — Replace with the real domain before launch. It feeds the canonical URL, Open Graph tags, sitemap.xml and JSON-LD.
3. **`address.postalCode`** — 77469 appears on public listings for this address. Confirm against the Google Business Profile.
4. **`phone`** — The brief gives (832) 867-3737. Public listings (Facebook, Yelp) show (346) 676-2634 for the same address. Confirm which number the owner wants published; the site must match the Google listing exactly.
5. **`hours`** — Hours below are from the restaurant's Facebook page (Mon–Thu 12–10 pm, Fri–Sat 12 pm–12 am, Sun 12–10 pm). A delivery listing shows 12:30 pm opening and 11 pm Fri–Sat close. Confirm from the Google Business Profile.
6. **`service`** — Dine-in, takeout and delivery options are not confirmed. Third-party listings show pickup and delivery; dine-in is implied by the lounge seating but unverified.
7. **`ordering`** — This is the DoorDash Storefront link found on public listings. Confirm it is the owner's preferred ordering link, otherwise remove it. No checkout is built into this site.
8. **`social[0]`** — Facebook page found by search. Confirm it belongs to this location.
9. **`priceRange`** — Set to '$' or '$$' to match the Google listing. Omitted from JSON-LD until set.
10. **`story`** — No owner-provided story yet. The paragraphs below only state what public listings show. Replace with the owner's own words (who cooks, where the recipes come from, when they opened).
11. **`menu`** — Items and prices were transcribed from the restaurant's public delivery listings (Postmates / DoorDash Storefront). Delivery prices are often marked up. Confirm every item and in-store price with the owner, add anything missing (drinks, sides, desserts, Yemeni tea), and remove anything no longer served.
12. **`menu.printable`** — menu.html is print-ready (File → Print → Save as PDF). Confirm whether the owner also wants a separately designed PDF menu.
13. **`gallery`** — No owner-approved photos yet. Drop originals in assets/img/source/, record them in assets/img/CREDITS.md, run `npm run images`, then list their ids here (8–12 images).
14. **`visit.parking`** — Add a one-line parking note (e.g. free lot in front) once confirmed.
15. **`visit.hookah`** — Public listings describe the venue as a hookah lounge (outdoor, indoor after 10 pm). Not mentioned on the site until the owner confirms it should be.
16. **`footer.since`** — Do not add 'since YYYY' or 'family recipe' claims until verified.
