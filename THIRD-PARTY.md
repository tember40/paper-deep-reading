# Third-party notices

Project software is MIT; the following components are not relicensed by us.

## PDF.js / pdfjs-dist 6.4.299

- Mozilla and contributors: https://github.com/mozilla/pdf.js
- Exact distribution: https://www.npmjs.com/package/pdfjs-dist/v/6.4.299
- Renderer, worker and viewer text-layer stylesheet: Apache-2.0.
- The unmodified package's LICENSE is copied to assets/vendor/pdfjs/LICENSE.txt.
- Required CMaps, standard PDF fonts, color profiles and image decoders retain the LICENSE / LICENSE_* notices supplied in their respective cmaps/, standard_fonts/, iccs/ and wasm/ directories. Those notices govern each asset; they are not covered by the project's MIT/CC notice. The builder copies each alongside the assets.
- In particular, Liberation Sans is the unmodified **1.07.4**, GPL v2 with the Liberation font exception, not OFL. See standard_fonts/LICENSE_LIBERATION and https://github.com/mozilla/pdf.js/blob/v6.4.299/external/standard_fonts/README.md . Corresponding unmodified source (FontForge SFD files, Makefile, scripts, License.txt and COPYING) is distributed at assets/vendor/pdfjs/font-source/liberation-fonts-1.07.4.tar.gz, alongside the displayed fonts. Source mirror, provenance and SHA-256 are in vendor/font-source/README.md. It is not covered by our MIT license.
- These are PDF display support fonts, not the website's typography. The website uses installed system fonts and does not call a remote font service.
- No optional native canvas package, scripting sandbox or QuickJS runtime is included in the static output. The core renderer is imported only after the reader selects a PDF.
- The local reader does not instantiate PDFScriptingManager, expose PDF annotation actions, or request XFA rendering. A same-origin Content Security Policy prohibits object/frame embedding and external connections. This does not make arbitrary untrusted PDFs risk-free.
- Reviewed advisory: https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j (patched version 6.2.108; installed 6.4.299). Future security fixes still need review and an explicit dependency/lockfile update.

## Approved public reading pilot (currently a local draft)

© 2019 Aharon Azulay, Yair Weiss. Why do deep convolutional networks generalize so poorly to small image transformations? JMLR 20(184):1–25, 2019.

Source: https://jmlr.org/papers/volume20/19-519/19-519.pdf

Metadata / attribution: https://jmlr.org/papers/v20/19-519.html

License: CC BY 4.0, explicitly stated on page 1: https://creativecommons.org/licenses/by/4.0/

The reading preserves authorship and source references, removes line-break hyphenation and running page headers, and rearranges paragraphs/captions into paired reading units. Korean translations and separate notes are unofficial AI-authored project adaptations, not author/publisher-approved or human-reviewed translations. External photographs and full PDF files are not mirrored. Appendix A is excluded. The article's quotations retain their context and attribution; this notice does not license the quoted third-party works in their entirety.

Exact version, SHA-256, provided range, exclusions and review states are recorded in content/readings/azulay-weiss-2019.json and READING-RIGHTS.md. Draft readings do not enter ordinary publication builds. User-supplied local PDF/translation files never become project content by being opened.

Graph excerpts in `src/figures/azulay-weiss-2019/figure-*.svg` (published as `assets/papers/azulay-weiss-2019/`) are adapted from the same CC BY 4.0 publication, © 2019 Aharon Azulay, Yair Weiss. Figures 1, 2, 4, 5, 6, 8, 9, 10 and 11 are included only in the individually stated panel scope. All raster image data and references have been removed, not merely concealed; external photographs are not redistributed. Vector chart paths, values, axes and original chart typography are not redrawn. Captions still describe the original complete figures. Tables are re-typeset as HTML; two display formulas as MathML. The asset manifest records source-page/crop/hash correspondence (LF-normalized hashes); regeneration requires visual review. These excerpts are not licensed as project MIT code. Attribution and a link to https://creativecommons.org/licenses/by/4.0/ must remain with reuse.
