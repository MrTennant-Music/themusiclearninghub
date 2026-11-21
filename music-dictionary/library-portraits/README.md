# Concept Audio Library thumbnails

Portraits are shared across excerpts by exact artist credit; musicals use posters.
Unnamed excerpts always use `ui-icons/assessment-cover-quavers.svg`. Missing or
failed images also fall back to that quaver. Images load lazily from local files.

`manifest.json` retains the source, rights information and review evidence for each
image. The image itself links to its source in the table. Existing verified Music
Dictionary portraits were reused before adding other sources. Files are WebP,
at most 128 pixels on either side. Identical bytes share one file.

`missing-portraits.md` lists unresolved credits. Search candidates are evidence
only: they are not automatically published. Review identity and image contents
before adding or replacing an entry in the manifest. Do not substitute album
covers or pictures of another performer for a composer portrait.

Run `python3 scripts/build-library-portraits.py` from the repository root to
validate and regenerate the compact browser catalogue from reviewed entries.
This command is offline and does not change audio, fetch images, or delete files.
