// Finds embedded metadata (EXIF, XMP, GPS) in JPEG, WebP and AVIF bytes. Used by scripts/make-tour-images.mjs
// and scripts/check-site.mjs so a tour photo can never be published with the camera's location in it.
// ICC colour profiles are allowed. Returns a list of short messages; empty = clean.
export function findMetadata(buf) {
  const out = [];
  const head = buf.subarray(0, 12);
  const isJpeg = head[0] === 0xff && head[1] === 0xd8;
  const isWebp = head.toString("ascii", 0, 4) === "RIFF" && head.toString("ascii", 8, 12) === "WEBP";
  const isAvif = buf.length > 12 && buf.toString("ascii", 4, 8) === "ftyp";
  if (isJpeg) {
    // Walk the marker segments up to the start of scan; APP1 (0xE1) is EXIF or XMP, APP13 (0xED) is IPTC.
    let pos = 2;
    while (pos + 4 <= buf.length && buf[pos] === 0xff) {
      const marker = buf[pos + 1];
      if (marker === 0xda || marker === 0xd9) break;
      const len = buf.readUInt16BE(pos + 2);
      const body = buf.toString("latin1", pos + 4, Math.min(pos + 4 + 32, buf.length));
      if (marker === 0xe1) out.push(body.startsWith("Exif") ? "JPEG EXIF (APP1)" : "JPEG APP1 (XMP or other metadata)");
      if (marker === 0xed) out.push("JPEG IPTC/Photoshop (APP13)");
      if (marker === 0xfe) out.push("JPEG comment");
      pos += 2 + len;
    }
  } else if (isWebp) {
    let pos = 12;
    while (pos + 8 <= buf.length) {
      const id = buf.toString("ascii", pos, pos + 4);
      const size = buf.readUInt32LE(pos + 4);
      if (id === "EXIF" || id === "XMP ") out.push(`WebP ${id.trim()} chunk`);
      pos += 8 + size + (size % 2);
    }
  } else if (isAvif) {
    // An EXIF or XMP item sits in the meta box as an item type ("Exif", "mime" with application/rdf+xml).
    const text = buf.toString("latin1");
    if (/infe[\s\S]{0,16}Exif/.test(text) || text.includes("Exif\0\0")) out.push("AVIF EXIF item");
    if (text.includes("application/rdf+xml") || text.includes("http://ns.adobe.com/xap")) out.push("AVIF XMP item");
  } else {
    out.push("not a JPEG, WebP or AVIF file");
  }
  if (buf.includes(Buffer.from("GPSLatitude")) || buf.includes(Buffer.from("GPSInfo"))) out.push("GPS text");
  return out;
}
