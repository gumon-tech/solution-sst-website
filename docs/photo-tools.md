# Photo tools for the shop photos

Checked 7 Nov 2026. Goal: make phone photos of the premises look professional (natural edits only), then export web sizes. Hard rules: free, open source preferred, **no shop photos uploaded to any service that keeps or trains on uploads**.

Natural edits means: exposure, white balance, straighten verticals, crop, noise, mild sharpening. Clutter clean-up only if it does not misrepresent the premises (a stray cable: fine; hiding a stained wall or changing the room: not fine).

## Comparison

| Tool | Type | Licence / cost | Strengths for interior shop photos | Privacy of uploads | Verdict |
|---|---|---|---|---|---|
| Darktable 5.6.2 | Local (Mac arm64) | GPL-3.0+, free | "Rotate and perspective" module (auto/manual vertical and horizontal correction), exposure, white balance, denoise, crop; non-destructive. 5.6 adds optional local AI (denoise/upscale, object mask) via downloaded ONNX models | Nothing leaves the machine (model download only) | **Pick** for per-photo look. Homebrew cask is disabled (see surprises) |
| RawTherapee 5.13 | Local | GPL-3.0, free | Strong denoise and sharpening, lens/perspective tools; suited to RAW, less to phone JPEGs | Local | Reserve; cask needs macOS 26+ (this Mac is fine) |
| GIMP 3.2.x | Local | GPL-3.0+, free | Perspective and Corrective tools, healing/clone for small clean-up, layers | Local | **Pick** as fallback for retouch and perspective |
| Krita 5.3.x | Local | GPL-3.0, free | Painting-oriented; weak photo corrections | Local | Skip: wrong tool |
| Photopea | Online (browser) | Free with ads; optional paid Premium | Photoshop-like; perspective, healing | Files "never leave your device" per its policy; cloud storage optional. Verify in the network tab | Acceptable emergency fallback only; closed source, so prefer GIMP |
| Upscayl 2.15.0 | Local app | AGPL-3.0, free | AI upscaling; rarely needed (phone photos are large enough). Last release Dec 2024 | Local | Optional; avoid upscaling shop photos (invents detail) |
| Real-ESRGAN (ncnn-vulkan) | Local CLI | BSD-3-Clause, free | Same as above; last binaries 2022 | Local | Skip: stale, not needed |
| rembg | Local (Python) | MIT, free; model weights have own licences (some non-commercial) | Background removal; useless for room interiors | Local by default; its optional `withoutbg`/`atlascloud` backends upload images | Skip unless a cut-out is needed; never enable cloud backends |
| IOPaint (lama-cleaner) 1.6.0 | Local web UI on localhost | Apache-2.0, free | Object removal (LaMa) for clutter | Self-hosted, CPU/Apple Silicon | **Pick, only if needed.** Repo archived by owner 13 Aug 2025 (still installs) |
| ImageMagick 7 | Local CLI | ImageMagick licence (Apache-style), free | Batch convert, resize, crop | Local | Redundant with sharp/vips; skip |
| libvips 8.18 / sharp 0.35 | Local CLI/lib | LGPL-2.1+ / Apache-2.0, free | Fast resize, AVIF/WebP/JPEG, strips metadata by default, already in the build | Local | **Pick** for the scripted batch |
| exiftool 13.55 | Local CLI | Perl/GPL, free | Verifies EXIF/GPS are gone | Local | **Pick** (verification) |
| Apple Photos (macOS) | Local | Bundled, free | Auto-enhance, straighten, perspective sliders, crop, noise; good for quick fixes | Local unless iCloud Photos is on, then it syncs to iCloud | Fine for a quick edit on a copy; turn off iCloud sync for the import |
| Canva (free) | Online | Free tier, account needed; paid tiers | Easy editing, templates | Account required; sources report content-for-AI-training is on by default for Free/Pro with an opt-out toggle | **Do not use** |
| Pixlr | Online | Free tier with limits, account for saving; paid tiers | Browser editor with AI tools | AI features send input to servers; terms not clear enough to trust | **Do not use** |
| Fotor | Online | Free tier, paid tiers, account | One-click enhancers | AI inputs stored on AWS (USA) for the life of the account; no clear statement that they are excluded from training | **Do not use** |

## What this room uses

Pipeline (all local, all free):

1. **Copy originals** off the phone into a folder outside the repo (for example `~/Pictures/ssw-originals/`). Never edit the originals.
2. **Per-photo look: Darktable** (or GIMP). Steps: rotate and perspective (straighten verticals; use the auto-fit on lines), exposure and white balance, mild denoise, crop, light sharpening. Export a full-size high-quality JPEG (sRGB). Why: non-destructive, best-in-class perspective module, fully offline.
3. **Clutter clean-up only if needed: IOPaint** (`iopaint start --model=lama --device=cpu --port=8080`, then open `http://localhost:8080`). Why: local LaMa inpainting, nothing uploaded. Keep edits minimal and honest.
4. **Scripted batch: sharp (via libvips) in the site build** for resize and for AVIF, WebP and JPEG fallback. Why: already a build dependency, reproducible, strips EXIF/GPS by default (do not call `withMetadata()`).
5. **Verify with exiftool**: `exiftool -a -G1 -gps:all -EXIF:all out/*.jpg` should print nothing relevant. Why: confirms no GPS or camera data ships.

### Install (Homebrew)

```sh
brew install vips exiftool      # sharp itself comes from npm (already in the project)
brew install --cask gimp        # fallback retouch and perspective
brew install --cask rawtherapee # optional
# Darktable: cask is disabled, download the .dmg from darktable.org (see below)
pipx install iopaint            # only if object removal is needed (or: pip3 install iopaint)
pipx install "rembg[cpu,cli]"   # only if a cut-out is ever needed
```

Batch sketch (Node, sharp):

```js
import sharp from 'sharp';
const img = sharp(input).rotate().resize({ width: 1600, withoutEnlargement: true });
await img.clone().avif({ quality: 55 }).toFile('out.avif');
await img.clone().webp({ quality: 78 }).toFile('out.webp');
await img.clone().jpeg({ quality: 82, mozjpeg: true }).toFile('out.jpg');
```

## Do not use for these photos

- **Canva, Pixlr, Fotor** (and similar one-click AI "enhancers"): uploads go to company servers, accounts are needed, retention and AI-training terms are unclear or default-on. Breaks the hard rule.
- **Any "free AI photo enhancer" website or app** found by search: same risk; unknown owners.
- **rembg cloud backends** (`withoutbg`, `atlascloud`): they upload images. Use the default local models only.
- **Photopea** unless GIMP is truly unavailable: files stay local per its policy, but it is closed source and loads cloud features; keep cloud storage disconnected.
- **Upscalers (Upscayl, Real-ESRGAN) and generative fill**: they invent detail and can misrepresent the premises; phone photos are already large enough.
- **Heavy "AI" retouching of walls, floors, people or treatment rooms**: customers must get what the photo shows.
- **iCloud-synced Apple Photos library** for the originals: GPS and metadata would be synced to iCloud.

## Surprises worth knowing

- Homebrew **disabled the darktable cask on 2026-09-01** because the app fails the macOS Gatekeeper check. Install from the official darktable.org macOS build instead (approve it in System Settings, Privacy and Security if macOS blocks it), or use GIMP/RawTherapee.
- **IOPaint was archived** by its owner (13 Aug 2025); it still works but gets no fixes.
- **Darktable 5.6 added optional AI** (neural denoise/upscale, AI masks). It runs locally with downloaded ONNX models; leave it off unless needed.
- Upscayl and Real-ESRGAN have had no recent releases (Dec 2024 and 2022).

## Sources

- darktable releases: https://github.com/darktable-org/darktable/releases
- darktable 5.6 AI features: https://alternativeto.net/news/2026/6/darktable-5-6-brings-optional-ai-neural-restore-ai-object-mask-tool-and-heif-export/
- Homebrew Gatekeeper policy: https://github.com/orgs/Homebrew/discussions/7050
- Homebrew cask pages: https://github.com/Homebrew/homebrew-cask/blob/HEAD/Casks/d/darktable.rb, https://github.com/Homebrew/homebrew-cask/blob/HEAD/Casks/r/rawtherapee.rb
- RawTherapee: https://rawtherapee.com/
- GIMP: https://www.gimp.org/ ; Krita: https://krita.org/
- Photopea privacy: https://www.photopea.com/privacy.html
- IOPaint (archived): https://github.com/Sanster/IOPaint
- Upscayl releases: https://github.com/upscayl/upscayl/releases
- Real-ESRGAN: https://github.com/xinntao/Real-ESRGAN
- rembg: https://github.com/danielgatis/rembg
- sharp: https://sharp.pixelplumbing.com/ ; libvips: https://github.com/libvips/libvips
- exiftool: https://exiftool.org/
- Fotor privacy: https://www.fotor.com/privacypolicy
- Canva AI terms summary (secondary source; verify in Canva settings): https://www.terms.law/ai-output-rights/canva/
- Pixlr licence and services agreement (mirror): https://tostracker.app/document/pixlr-eula
