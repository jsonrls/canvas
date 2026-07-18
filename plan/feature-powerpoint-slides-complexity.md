---
goal: Assess complexity of adding teacher PowerPoint playback so BoardPrep is one platform for annotate, whiteboard, and shared notes
version: 1.0
date_created: 2026-07-18
last_updated: 2026-07-18
owner: BoardPrep Engineering
status: "Analysis"
tags: [feature, complexity, powerpoint, slides, pdf, whiteboard, notes, yjs]
---

# PowerPoint / Slides Feature — Complexity Assessment

## Context

BoardPrep already delivers a unified study desk:

| Capability | Status |
|---|---|
| Shared notes | Done (Tiptap + Yjs) |
| PDF annotate | Done (`react-pdf` + Yjs annotations) |
| Whiteboard | Done (SVG + Yjs) |
| Rooms, roles, offline, versioning | Done |

Adding teacher PowerPoint playback is an **extension of Phase 3 study tools**, not a product rewrite. The collaboration backbone (rooms, roles, Yjs channels, private storage, offline, tabs) already exists.

---

## What already helps

Reusable patterns from the current codebase:

1. **Document kinds** — already `notes | pdf | whiteboard`; can add `slides` or treat slides as PDF
2. **`use-collaborative-tool`** — connection lifecycle, offline, viewer mode
3. **Private Storage two-phase upload** — same pattern as `/api/rooms/[roomId]/pdf`
4. **Yjs maps by object id** — annotations merge independently
5. **Room tabs** — Notes / PDF / Whiteboard already unified in `CollaborativeRoom`

---

## Complexity depends on *how* slides work

### Option A — Convert PPTX → PDF, reuse PDF tool

**Complexity: Low–Medium** · ~1–2 weeks

Teachers upload `.pptx`; convert server-side (or via a library/service) to PDF and plug into the existing PDF studio.

| Area | Effort |
|---|---|
| Upload MIME/validation for `.pptx` | Small |
| Conversion (LibreOffice, CloudConvert, etc.) | Medium |
| Storage + revision (like PDF compare-and-swap) | Small–Medium |
| UI: “Slides” tab or PDF rename | Small |
| Annotation/sync | **Reuse PDF tool** |

**Pros:** Fastest path to “play slides + annotate.”  
**Cons:** Not a true PowerPoint experience (animations, clickable embeds, presenter notes, live edit of slides).

**Best fit** if the goal is teaching from slides on the same desk, not rebuilding PowerPoint.

---

### Option B — PPTX → per-slide images + slide deck UI

**Complexity: Medium** · ~3–5 weeks

Render slides as images, add prev/next, presenter mode, optional laser/pointer, annotations per slide.

| Area | Effort |
|---|---|
| Conversion pipeline | Medium |
| Slide model + Yjs `deck` document kind | Medium |
| Viewer UI (nav, zoom, fullscreen) | Medium |
| Annotations per slide (reuse PDF annotation model) | Medium |
| Teacher “presenter control” (sync current slide for room) | Medium–High |
| Storage for multi-asset decks | Medium |

**Pros:** Feels like a presentation mode; can sync “everyone is on slide 7.”  
**Cons:** Still no real animations/edit; multi-file storage is more work than one PDF.

---

### Option C — Native in-browser PPTX player

**Complexity: High–Very High** · ~2–4+ months

Parse/render real `.pptx` (OOXML), animations, fonts, layouts, charts, etc.

| Area | Effort |
|---|---|
| OOXML parse + layout engine | Very high |
| Fonts, charts, SmartArt, media | Very high |
| Reliability across real teacher decks | Very high |
| Security (malicious OOXML/macros) | High |

**Not recommended** unless slides are the core product. Browser PPTX fidelity is a product of its own (OnlyOffice / Microsoft-class work).

---

### Option D — Embed Office Online / Google Slides

**Complexity: Medium, high product/ops risk** · ~2–4 weeks integration + ongoing dependency

Iframe Microsoft/Google viewer; keep notes/whiteboard alongside.

**Pros:** Real slide fidelity.  
**Cons:** Auth, iframe constraints, offline, private rooms, annotation-on-top, and “one platform” control are all weaker. Hard to annotate *on* the slide surface cleanly.

---

## Complexity for the “one platform” vision

If the real goal is:

> One room where teacher plays slides, class annotates, whiteboard brainstorms, and notes capture takeaways

then complexity is not only “add PowerPoint.” It spans product surface, sync, and pedagogy:

| Layer | Complexity | Notes |
|---|---|---|
| Upload & play slides | Low–Med (A) / Med (B) | Conversion vs deck UI |
| Annotate on slides | Low if A (reuse PDF); Med if B | PDF annotation model already exists |
| Whiteboard + notes same room | **Already done** | Tab nav in `CollaborativeRoom` |
| Teacher-controlled shared slide index | Medium | New awareness/Yjs field: `currentSlide` |
| Presenter mode (laser, follow-me) | Medium | Laser already exists on whiteboard |
| Multi-deck library (not one file/room) | Medium–High | Phase 3 deliberately scoped to one PDF/room |
| Live co-edit of the PPTX itself | Very High | Out of scope for “play + annotate” |
| Version history for slide annotations | Medium | Notes have it; PDF/whiteboard less so |

### Overall for a solid MVP

| Scope | Complexity | Order of magnitude |
|---|---|---|
| “Upload PPTX, view as PDF, annotate” (Option A) | **Low–Medium** | 1–2 weeks |
| “Presentation mode + everyone follows teacher” (Option B) | **Medium–High** | 3–5 weeks (~1.5–2× Phase 3 PDF work) |
| “True PowerPoint player + edit” (Option C) | **Very High** | months |
| Notes + whiteboard + annotate together | **Already built** | — |

---

## Biggest new hard parts

- **Conversion reliability** — real teacher decks break often
- **File size / multi-asset storage** — PPTX often exceeds the current 15 MiB PDF limit
- **Shared presentation state** — who controls the page/slide?
- **Security** — Office files are a malware vector; need strict validation, preferably convert-and-discard originals

---

## Recommended path

### Phase 1 — MVP (~1–2 weeks after conversion is chosen)

- Teacher uploads PPTX → convert to PDF → existing PDF studio
- Optionally label tab “Slides”
- Annotation, notes, and whiteboard already complete the “one platform” story

### Phase 2 — Presenting (if teachers need real live control)

- Shared `currentSlide` / follow-teacher mode
- Fullscreen presenter UI
- Optional laser over slides

### Phase 3 — Only if needed

- Multi-deck library
- Slide-level assets
- Richer deck model

Avoid native PPTX rendering unless that becomes the core product.

---

## Bottom line

For “one platform to annotate, whiteboard, and share notes *while teaching from PowerPoint*,” complexity is **manageable (Medium)** if PowerPoint is treated as a **presentable document** (convert + reuse the PDF pipeline), not as rebuilding Microsoft PowerPoint.

The collaboration platform is largely done. The new cost is:

1. Slide ingestion / conversion
2. Fidelity expectations
3. Optional presenter sync

---

## Related existing work

- `plan/feature-phase-3-study-tools-1.md` — PDF annotation + whiteboard (completed)
- `src/components/collaboration/pdf-study-tool.tsx` — collaborative PDF + annotations
- `src/components/collaboration/whiteboard-study-tool.tsx` — SVG/Yjs whiteboard
- `src/components/collaboration/collaborative-room.tsx` — unified tool navigation
- `src/app/api/rooms/[roomId]/pdf/route.ts` — private two-phase PDF upload
- `.agents/ARCHITECTURE.md` — document kinds, storage, Yjs routing
