# Liberation Sans 1.07.4 corresponding source

Unmodified upstream source archive distributed alongside the four LiberationSans .ttf fallback fonts in PDF.js 6.4.299. This is third-party font source, **not** project-authored MIT software.

- Font copyright: © 2007 Red Hat, Inc.; see included License.txt and COPYING.
- License: GPL v2 with the Liberation font exception. The PDF.js tag's own README identifies this exact version and license: https://github.com/mozilla/pdf.js/blob/v6.4.299/external/standard_fonts/README.md
- Source: Debian's official mirror of the upstream 1.07.4 source archive, https://deb.debian.org/debian/pool/main/f/fonts-liberation/fonts-liberation_1.07.4.orig.tar.gz
- Debian source descriptor (same archive hash/size): https://deb.debian.org/debian/pool/main/f/fonts-liberation/fonts-liberation_1.07.4-11.dsc
- SHA-256: ad98b7498dc2992f7f0868f79b65ce4a720a3acdb63ab3f1f1cb6881117a5406
- Size: 2,937,949 bytes. Retrieved 2026-10-22. HTTPS download and descriptor checksum compared; PGP signature was not independently verified.
- Local filename: liberation-fonts-1.07.4.tar.gz (archive contents unmodified).
- The archive includes src/*.sfd, Makefile, scripts/, License.txt, COPYING, README, AUTHORS and ChangeLog. It is not merely a repackaging of the four binary fonts. We do not execute its build scripts in the site build.

The website builder verifies this SHA-256 and copies the same archive to assets/vendor/pdfjs/font-source/liberation-fonts-1.07.4.tar.gz. The local reader and rights page provide an explicit source-download link. It is not fetched by opening a paper or opening a personal PDF. Font sources and copyright/license notices must remain available when redistributing the fallback fonts. Review this pairing before updating PDF.js; do not assume later Liberation 2.x OFL licensing applies to these bytes.
