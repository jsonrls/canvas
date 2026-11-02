# Canvas: SaaS Opportunity Validation

**Research date:** July 18, 2026
**Decision:** **Conditional GO — validate a focused Philippine licensure-cohort SaaS before broadening**
**Recommended beachhead:** Philippine Nursing Licensure Examination (PNLE) study groups and nursing review centers
**Confidence:** Share with caveats; the product and market evidence are encouraging, but there is no production retention, payment, or interview data yet.

---

## 1. Executive summary

Canvas has a credible SaaS opportunity, but not as another generic “AI study app.” Its strongest position is a **group-native, resilient study workspace for high-stakes exam cohorts**: shared notes, review PDFs, a collaborative whiteboard, presenter-led sessions, permissions, history, offline recovery, and AI-generated practice inside one room.

The most promising initial customer is a Filipino nursing student who organizes a three-to-eight-person PNLE study group. The more attractive economic buyer is a nursing review center, instructor, or cohort coordinator who can pay once and invite learners for free. The repository is already unusually aligned with this niche: its AI system explicitly behaves as a cautious medical study assistant, while the product architecture emphasizes collaboration, recoverability, and controlled access.

The market is large enough for a meaningful bootstrap or small vertical-SaaS business. The Professional Regulation Commission (PRC) reported **577,844 licensure examinees across 91 examinations in 2024**, while Philippine higher education had approximately **5.14 million enrollments in 2023–24**. A transparent bottom-up model produces an estimated **₱172.2 million core annual opportunity** across PRC candidate groups and a **₱51.7 million serviceable market** under a conservative 30% digital-collaboration assumption. These figures are scenarios, not forecasts: PRC examinee counts may include repeated people, and group size, reachable share, and price still need validation.

The current product’s genuine advantages are:

- The **room**, rather than an individual deck or notebook, is the primary unit of value.
- Notes, PDFs, whiteboards, AI practice, permissions, presenter controls, and recovery live in one shared context.
- Offline merge, conflict review, immutable note history, and role-aware collaboration reduce a painful group-study risk: losing, overwriting, or fragmenting shared work.
- The architecture can support a product-led invitation loop: one organizer creates a room and brings several learners into the product.

Its principal weaknesses are equally clear:

- There is no structured learning-outcome loop yet: no spaced repetition, mastery tracking, weak-topic analytics, exam blueprint, question bank, or exam calendar.
- AI summaries, quizzes, and flashcards are now commodity features offered by Quizlet, Knowt, RemNote, NotebookLM, Studocu, and others.
- The repository has no billing, entitlements, product analytics, onboarding funnel, or public marketing site.
- Invitations are cumbersome, cold offline startup is missing, PDF AI extraction is absent, saved AI guides are private rather than group-shared, and mobile/PWA readiness is limited.
- Free substitutes are formidable: Notion or Google Docs for notes, Miro for whiteboarding, OneNote or Goodnotes for ink/PDFs, NotebookLM for source-grounded AI, and Quizlet or RemNote for practice.

The strategic recommendation is therefore to **sell an exam-cohort operating system, not a bundle of study features**. Start with PNLE rooms and review-center pilots; make collaborators free; charge the organizer approximately **₱199 per month or ₱1,490 per year** as a price test; and offer review centers an initial **₱4,990 per month / ₱59,900 per year** cohort plan. Do not treat those prices as final until payment tests are complete.

The next 90 days should prioritize customer discovery, instrumentation, invitations, exam-specific templates, and paid pilots. Proceed only if cohorts repeatedly collaborate and pay. A reasonable go threshold is at least 45% activation, 30% week-four retained rooms, 20% organizer payment conversion from qualified offers, or two paid review-center pilots. If learners mainly use BoardPrep as a one-time individual AI generator, the vertical collaborative thesis should be rejected or substantially revised.

### Opportunity scorecard

| Dimension             |   Weight |     Score | Evidence-based interpretation                                                                                                         |
| --------------------- | -------: | --------: | ------------------------------------------------------------------------------------------------------------------------------------- |
| Problem severity      |      20% |     4.0/5 | High-stakes cohorts coordinate notes, files, review sessions, and practice across fragmented tools; failures are costly near an exam. |
| Market attractiveness |      15% |     3.0/5 | Large recurring exam volume, but local student budgets and seasonality constrain consumer ARPU.                                       |
| Differentiation       |      15% |     3.5/5 | Strong integrated group workflow and resilience; individual features are widely available elsewhere.                                  |
| Willingness to pay    |      15% |     3.0/5 | Existing review-center fees prove category spend, but willingness to pay for software is unproven.                                    |
| Product readiness     |      15% |     2.5/5 | Functional collaborative core and passing engineering checks; missing SaaS operations, learning outcomes, and onboarding.             |
| Distribution          |      10% |     1.0/5 | No demonstrated acquisition channel, audience, referral data, or institutional relationships.                                         |
| Defensibility         |       5% |     2.0/5 | Current feature moat is modest; vertical workflows, data, reliability, and partnerships could improve it.                             |
| Unit economics        |       5% |     4.0/5 | AI generation is inexpensive at current limits; storage, realtime infrastructure, support, and acquisition need measurement.          |
| **Weighted result**   | **100%** | **3.0/5** | **Promising enough for a focused paid validation, not enough for a broad launch or scale claim.**                                     |

---

## 2. What the project actually is

### Product definition

Canvas is an authenticated collaborative study workspace built with Next.js, Supabase, Tiptap, React PDF, Yjs, and the OpenAI Responses API. The implemented experience centers on public or private rooms with owner, editor, and viewer roles. Within a room, members can work across:

- Realtime shared notes with live cursors
- Local recovery, reconnection review, and immutable note versions
- A private PDF workspace with highlights, underlines, freehand marks, sticky notes, comments, replies, bookmarks, and zoom
- An SVG whiteboard with drawing, shapes, arrows, text, images, and a laser pointer
- AI-generated summaries, quizzes, flashcards, recommendations, and cautious misconception checks from an explicit note snapshot
- Private saved AI guides
- Public-room discovery and room membership controls
- Presenter/follower interactions now present in the working tree

The technical details and current limitations are documented in the project [README](./README.md). The product’s core is materially more advanced than a prototype landing page: type checking, linting, production compilation, room permissions, offline-sync checks, conflict-review checks, and password-reset checks all pass in the current working tree.

### What it is not yet

It is not a complete SaaS business system. The repository currently has no visible implementation of:

- Subscription billing, checkout, invoices, taxes, entitlements, or plan quotas
- Product analytics, funnel tracking, cohort retention, or revenue instrumentation
- A public marketing site or search-acquisition content
- Guided onboarding, room templates, or exam-specific setup
- Spaced repetition, mastery scores, progress dashboards, weak-topic detection, or an exam scheduler
- A curated question bank or answer analytics
- Pending email invitations, roster imports, organization administration, or institutional SSO
- A service worker for cold offline startup or a native mobile application
- Formal moderation, copyright enforcement, abuse reporting, or public-room trust operations
- Complete privacy operations such as self-service export/deletion, retention controls, data-processing agreements, and documented privacy-impact assessment

This distinction matters: the repository demonstrates **product capability**, not demand, retention, willingness to pay, or repeatable distribution.

### Present product limitations that affect commercial readiness

The repository itself discloses several constraints:

- Offline recovery works during an active session, but cold offline startup is not supported.
- Reconnection review is excerpt-based rather than a complete human-readable merge history.
- The Yjs server rewrites full-state blobs and will eventually need incremental persistence, compaction, and monitoring.
- A room supports one active PDF, without OCR, semantic text selection, advanced transforms, templates, or a media library.
- AI only receives note snapshots; it cannot yet ground answers in PDFs or whiteboards.
- Saved AI guides are private to their creator instead of being governed shared-room artifacts.
- Rate limiting is instance-local.
- WebSocket access tokens are sent in an upgrade-query parameter and therefore require infrastructure log redaction or a short-lived ticket exchange.
- Collaborators must already have an account and be added by exact email; there are no pending invitations, bulk invites, ownership transfers, archive controls, or mature discovery pagination.

These are addressable engineering gaps, but several become material once money, institutions, or sensitive educational data enter the system.

---

## 3. Customer problem and jobs to be done

### Primary customer hypothesis

**User:** A PNLE candidate studying with three to eight classmates.
**Champion:** The person who creates the group chat, schedules review sessions, consolidates notes, or teaches peers.
**Economic buyer:** Initially the organizer; preferably a review center, instructor, student organization, or school program.
**Moment of highest pain:** Four to twelve weeks before the licensure exam, when source materials, backlogs, practice questions, and group coordination intensify.

### Core job to be done

> When our group is preparing for a high-stakes licensure exam, help us turn scattered review materials and conversations into one reliable, shared study system so that everyone knows what to review, can practice together, and does not lose the group’s work.

### Functional jobs

1. Consolidate notes, annotated review material, diagrams, and discussions.
2. Run a synchronous review session where one person presents and others follow.
3. Preserve corrections and decisions without silently overwriting another person’s contribution.
4. Transform reviewed material into retrieval practice.
5. Track what the cohort has covered and where it remains weak.
6. Continue working through unstable connectivity and safely reconcile afterward.
7. Invite classmates quickly without administering a complex workspace.
8. Give an instructor or organizer visibility and control without preventing learner contribution.

### Emotional and social jobs

- Reduce the anxiety that important topics or corrections were missed.
- Make group study feel organized and fair instead of dependent on one person’s files.
- Create visible accountability before the exam.
- Help the organizer look competent and helpful to peers.
- Give learners confidence that AI-generated material is grounded in their review content rather than invented.

### Evidence that the learning model is directionally sound

BoardPrep’s group workflow and practice generation align with established learning evidence:

- A 2026 second-order meta-analysis reported a moderate overall cooperative-learning effect size of **0.71** across prior meta-analyses ([Educational Psychology meta-analysis](https://doi.org/10.1007/s12144-025-08943-0)).
- A 2025 meta-analysis of technology-supported collaborative learning reported an overall effect size of **0.71**, including **0.80** for academic achievement ([Humanities and Social Sciences Communications](https://www.nature.com/articles/s41599-025-05766-z)).
- A classroom retrieval-practice systematic review covered 50 experiments and 5,374 learners; 57% of reported effects were medium or large ([ERIC record](https://eric.ed.gov/?id=EJ1319572)).
- A meta-analysis of quizzing found a medium overall effect of **g = 0.499** ([PubMed](https://pubmed.ncbi.nlm.nih.gov/33683913/)).
- A broader review of learning techniques found distributed practice and practice testing among the strongest supported strategies across 242 studies and 169,179 participants ([Frontiers in Education](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2021.581216/full)).

The implication is important: BoardPrep should not stop at generating cards and quizzes. The defensible learning loop is **group artifact → grounded practice → scheduled retrieval → measured weak topics → next collaborative review**. Most of that loop is still missing.

### Directional community signals

Public discussions are not statistically representative, but they reveal hypotheses worth testing:

- PNLE learners describe tradeoffs between travel, fatigue, money, recordings, and the flexibility of online review ([NursingPH discussion](https://www.reddit.com/r/NursingPH/comments/1iq83b3/pnle_full_online_review_center/)).
- Board-review candidates report large video backlogs and feeling overwhelmed by multiple reviewers and resources ([MedTechPH discussion](https://dd.reddit.com/r/MedTechPH/comments/1fvr9tf/do_you_regret_choosing_the_review_center_you/)).
- Students considering collaborative notes worry about vandalism, version rollback, and the difficulty of maintaining a master database ([college discussion](https://www.reddit.com/r/college/comments/10g6ab2)).
- Learners regularly describe materials scattered across apps and switching among notes, flashcards, PDFs, and AI tools ([study tips discussion](https://www.reddit.com/r/studytips/comments/1ssbeyv/if_your_study_materials_feel_scattered_this/)).

These signals support interviews about fragmentation and coordination; they do not prove demand for BoardPrep.

---

## 4. Market opportunity

### Philippine professional-exam market

The [PRC 2024 Annual Report](https://www.prc.gov.ph/sites/default/files/2024%20PRC%20Annual%20Report%20%281%29.pdf) reported:

- 507,286 licensure-examination applications processed
- 91 licensure examinations administered, including 19 computer-based examinations
- 577,844 examinees
- 319,513 passers, a 55.29% overall passing rate
- More than 5.55 million registered professionals, with approximately 3.29 million valid professional identification cards

The annual examinee figure is the best available top-down demand proxy for BoardPrep’s initial category. It should not be interpreted as unique people: an individual may take multiple examinations or repeat an examination.

### Higher-education adjacency

Philippine higher education recorded approximately **5,140,409 enrollments in 2023–24**, up from 4,792,160 in 2022–23, based on first-semester institutional submissions summarized in official and policy sources ([CHED statistics portal](https://ched.gov.ph/statistics/), [PIDS higher-education analysis](https://pidswebs.pids.gov.ph/CDN/document/pidsdps2441.pdf)). CHED listed **2,410 higher-education institutions including satellite campuses** for 2023–24 ([CHED institution table](https://ched.gov.ph/wp-content/uploads/Higher-Education-Institution-by-Region-Sector-and-Institutional-Type_2023-2024.pdf)).

This is an expansion market, not BoardPrep’s immediate serviceable market. General college collaboration is less urgent and much more exposed to free productivity suites.

### Why nursing is the best beachhead

Nursing combines product fit, cohort density, high-stakes preparation, and an existing review-spend category:

- The May 2024 PNLE had 11,116 examinees and 7,749 passers ([PRC result](https://www.prc.gov.ph/node/6944)).
- The November 2024 PNLE had 34,534 examinees and 29,349 passers ([PRC result](https://www.prc.gov.ph/node/7209)).
- The combined 2024 local PNLE volume was therefore 45,650 examinee events.
- The November 2025 PNLE grew to 45,192 examinees and 40,692 passers ([PRC result](https://www.prc.gov.ph/index.php/article/november-2025-nurses-licensure-examination-results-released-fifteen-15-working-days)).
- BoardPrep’s current AI prompt already identifies it as a cautious medical study assistant, reducing the distance between the current implementation and a nursing-specific proposition.

Review-center prices demonstrate that candidates already spend meaningfully on preparation. Examples include CEVAS advertising a nursing package at **₱15,950 promotional / ₱18,950 original** ([CEVAS](https://www.cevasphilippines.com/cevas-nursing-nle-review-center)) and ACTS listing an online program at **₱13,500** ([ACTS FAQ](https://actsreviewcenter.com/faqs/)). Carl Balita Review Center states that it has 181 Philippine branches and six international branches across multiple licensure categories ([CBRC](https://drcarlbalitareviewcenter.com/)). These figures validate spending in the broad review category, not willingness to pay for BoardPrep specifically.

### Expansion sequence

After PNLE validation, expansion should follow exam density and workflow similarity:

1. Allied-health boards such as medical technology, pharmacy, physical therapy, and dentistry
2. Licensure Examination for Professional Teachers (LET)
3. Civil engineering, criminology, accountancy, architecture, and other large PRC categories
4. Review centers operating across multiple boards
5. Undergraduate capstones, laboratory courses, and other collaborative higher-education use cases
6. Southeast Asian and global professional-exam cohorts only after the Philippine playbook is repeatable

The LET is especially large: the March 2026 examination recorded 32,796 elementary and 61,561 secondary examinees, or 94,357 total ([PRC result](https://prc.gov.ph/article/march-2026-licensure-examination-professional-teachers-results-released-thirty-nine-39)). Its content and buyer workflows differ from nursing, so it should be treated as a second vertical rather than a simple marketing change.

---

## 5. TAM, SAM, and SOM

### Model design

This model uses a **paid-group unit**, because BoardPrep’s value is created by an organizer inviting collaborators. It avoids pretending every learner will buy an individual subscription.

#### Known inputs

| Input                                  |     Value | Source                             |
| -------------------------------------- | --------: | ---------------------------------- |
| Annual PRC examinee events             |   577,844 | PRC 2024 Annual Report             |
| 2024 PNLE examinee events              |    45,650 | May plus November 2024 PRC results |
| Philippine higher-education enrollment | 5,140,409 | CHED/PIDS 2023–24 reporting        |

#### Assumptions to validate

| Assumption                                  |   Base value | Why it is used                                            |
| ------------------------------------------- | -----------: | --------------------------------------------------------- |
| Learners per paid group                     |            5 | Plausible small study-group size; not yet measured        |
| Organizer annual price                      |       ₱1,490 | Affordable relative to review-center fees; must be tested |
| Digitally collaborative/reachable PRC share |          30% | Conservative serviceability filter; not observed          |
| Review-center account price                 | ₱60,000/year | Rounded pilot target for a small cohort product           |

### Results

| Market layer                                        | Formula                   | Annual opportunity |
| --------------------------------------------------- | ------------------------- | -----------------: |
| **Core TAM: all PRC candidate groups**              | 577,844 ÷ 5 × ₱1,490      |        **₱172.2M** |
| **Initial SAM: reachable collaborative PRC groups** | Core TAM × 30%            |         **₱51.7M** |
| **PNLE organizer wedge**                            | 45,650 ÷ 5 × 30% × ₱1,490 |          **₱4.1M** |
| **Adjacent HE TAM**                                 | 5,140,409 ÷ 5 × ₱1,490    |         **₱1.53B** |

The PNLE figure is deliberately small. It is a focused validation wedge, not the final business. The broader PRC market can support a meaningful vertical SaaS if the same product and distribution motion transfer across examinations. The higher-education TAM should not be used in an investor headline until BoardPrep proves that ordinary students retain and pay outside a licensure cycle.

### Three-year SOM scenarios

The following scenarios combine organizer subscriptions with review-center accounts. They are planning cases, not forecasts.

| Scenario     | Paid share of all PRC group equivalents | Paid organizer groups | Organizer ARR | Review-center accounts | B2B ARR |   Total ARR | MRR equivalent |
| ------------ | --------------------------------------: | --------------------: | ------------: | ---------------------: | ------: | ----------: | -------------: |
| Conservative |                                    0.5% |                   578 |         ₱861K |                     10 |   ₱600K |  **₱1.46M** |      **₱122K** |
| Base         |                                    2.0% |                 2,311 |        ₱3.44M |                     40 |  ₱2.40M |  **₱5.84M** |      **₱487K** |
| Aggressive   |                                    5.0% |                 5,778 |        ₱8.61M |                    100 |  ₱6.00M | **₱14.61M** |     **₱1.22M** |

At this stage, the evidence supports a bootstrap or capital-efficient vertical SaaS thesis. It does **not** yet demonstrate a venture-scale outcome. Venture scale would require international expansion, institutional contracts, a proprietary content/data network, or a much higher-value workflow.

### Price sensitivity

At the same 30% reachable share, annual organizer revenue changes as follows:

| Annual organizer price | Initial SAM |
| ---------------------: | ----------: |
|                   ₱990 |      ₱34.3M |
|                 ₱1,490 |      ₱51.7M |
|                 ₱2,990 |     ₱103.7M |

Adoption and retention are more important uncertainties than inference cost. Pricing research should therefore focus on the perceived value of group organization and exam outcomes, not simply undercutting AI tools.

---

## 6. Competitive landscape

### Competitor categories

BoardPrep competes against a stack rather than one product:

1. **Flashcard and practice systems:** Quizlet, Knowt, Brainscape, RemNote
2. **Source-grounded AI study tools:** NotebookLM, Studocu, Knowt
3. **Collaborative notes and productivity:** Notion, Google Docs, OneNote
4. **Whiteboards and visual collaboration:** Miro
5. **Digital note/PDF applications:** Goodnotes, OneNote
6. **Focus and accountability communities:** Study Together/StudyStream
7. **Review-center delivery systems:** proprietary portals, Facebook groups, Zoom, Google Drive, messaging apps, and learning-management systems

The most dangerous substitute is not one paid competitor. It is the familiar free bundle of Messenger or Discord + Google Drive/Docs + Zoom/Meet + Quizlet or NotebookLM.

### Feature and strategic comparison

Public feature pages were reviewed on July 18, 2026. “Partial” means a capability exists but is not equivalent in depth or workflow. Products change frequently.

| Product                  | Primary job                              |             Realtime shared authoring | PDF markup | Whiteboard | AI study outputs |                                Offline/recovery | Structured mastery / spaced practice |     Content network | BoardPrep implication                                                                |
| ------------------------ | ---------------------------------------- | ------------------------------------: | ---------: | ---------: | ---------------: | ----------------------------------------------: | -----------------------------------: | ------------------: | ------------------------------------------------------------------------------------ |
| **BoardPrep**            | Shared exam-prep room                    |                                   Yes |        Yes |        Yes |              Yes | Strong active-session recovery; no cold offline |                                   No |                  No | Broadest integrated cohort workflow, but weak outcome tracking and distribution      |
| **Quizlet**              | Flashcards and adaptive practice         |                               Partial |         No |         No |              Yes |                                         Partial |                                  Yes |              Strong | BoardPrep should not compete on generated flashcards alone                           |
| **Knowt**                | AI notes, summaries, and practice        |                               Partial |    Partial |         No |              Yes |                                         Partial |                                  Yes |             Growing | Aggressive free/AI value increases pressure on consumer pricing                      |
| **RemNote**              | Notes linked to spaced repetition        |                               Partial |        Yes |         No |              Yes |                                             Yes |                               Strong |             Limited | Strongest learning-system benchmark; BoardPrep needs a recurring mastery loop        |
| **NotebookLM**           | Source-grounded AI notebook              | Sharing, not live canvas co-authoring |         No |         No |              Yes |                                         Partial |                              Partial |                  No | Source grounding and citations set the expected AI trust standard                    |
| **Goodnotes**            | Handwritten notes and PDFs               |                                   Yes |        Yes |        Yes |              Yes |                                             Yes |                              Partial |                  No | High feature overlap; BoardPrep must win on cohort/exam workflow, not canvas breadth |
| **Notion / Google Docs** | Flexible collaborative workspace         |                                   Yes |    Limited |    Limited |              Yes |                                         Partial |                                   No | Template ecosystems | Free, familiar default; BoardPrep must remove exam-specific setup work               |
| **Miro**                 | Visual collaboration                     |                                   Yes |    Partial |     Strong |              Yes |                                         Partial |                                   No |  Template ecosystem | Education plan makes generic whiteboarding hard to monetize                          |
| **Studocu**              | Student-material network and AI practice |                               Partial |         No |         No |              Yes |                                         Partial |                              Partial |              Strong | Network effects and content discovery are significant advantages                     |
| **Study Together**       | Focus rooms and accountability           |                               Partial |         No |         No |               No |                                              No |                                   No |           Community | Community scale is an acquisition asset BoardPrep does not yet have                  |

### Pricing benchmarks

| Product             | Public benchmark                                                                                                                                                                                                                    | Strategic meaning                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Quizlet Plus        | Approximately US$6.99/month on its public [upgrade page](https://quizlet.com/upgrade)                                                                                                                                               | Mature brand anchors individual study-tool pricing                     |
| Knowt Student Ultra | US$149.99/year or US$24.99 monthly on its [plans page](https://knowt.com/plans?tab=Student+Ultra)                                                                                                                                   | AI-heavy premium tiers can be expensive, but a strong free tier exists |
| RemNote Pro         | US$8/month billed annually; Pro+AI US$18/month on [RemNote pricing](https://www.remnote.com/pricing)                                                                                                                                | Deep learning workflows command premium individual pricing             |
| NotebookLM          | Standard tier free; expanded limits bundled with Google AI plans in [Google support](https://support.google.com/notebooklm/answer/16213268)                                                                                         | Source-grounded AI is becoming an ecosystem feature                    |
| Miro                | Free tier with three editable boards on [Miro pricing](https://miro.com/pricing/); eligible education users can receive free expanded plans ([education plan](https://help.miro.com/hc/en-us/articles/360017730473-Education-plan)) | Generic whiteboard value faces a zero-price education benchmark        |
| Notion              | Eligible individual students and teachers receive a free Plus plan; approved student organizations can receive multi-member benefits ([Notion for education](https://www.notion.com/help/notion-for-education))                     | Flexible collaboration and templates are often free                    |
| Goodnotes           | Essential US$11.99/year, Pro US$35.99/year, Teams US$120/seat/year on [Goodnotes pricing](https://www.goodnotes.com/pricing)                                                                                                        | Low-cost individual PDF/ink tools and higher-value team plans coexist  |
| Brainscape Pro      | Approximately US$7.99/month on annual billing on [Brainscape pricing](https://www.brainscape.com/pricing?pack_id=22673357&paywall=private_access_code)                                                                              | Adaptive flashcards have an established paid category                  |
| OneNote             | Included in free Office 365 Education offers on [Microsoft Education](https://www.microsoft.com/en/education/products/onenote)                                                                                                      | Institutional bundles make basic notes and ink difficult to charge for |

Prices may vary by country, billing period, promotion, tax, and plan change. They are anchors, not directly comparable packages.

### Where competitors are stronger

- Quizlet and Studocu have content, brand, search acquisition, and network effects.
- RemNote has a substantially deeper personal knowledge and spaced-repetition system.
- NotebookLM is stronger at source-grounded AI with citations and benefits from Google distribution.
- Goodnotes and OneNote have mature cross-device handwriting, PDF, and offline experiences.
- Miro is a far deeper visual-collaboration platform.
- Notion and Google Workspace are already embedded in student and institutional behavior.
- Review centers own the learner relationship, curriculum, instructors, and exam-specific content.

### Where BoardPrep can win

BoardPrep can win when the user’s question is not “Where do I make flashcards?” but:

> “Where does our cohort do the entire review session, preserve the group’s work, and turn it into the next round of practice?”

That is a narrower but more coherent position than an all-in-one personal study tool.

---

## 7. BoardPrep’s defensible edges

### Edge 1: The group room is the product

Most study products begin with a personal notebook, personal deck, or uploaded source and add sharing later. BoardPrep begins with membership, roles, shared state, and artifacts inside a room. That makes group coordination central rather than incidental.

**Why it matters:** The organizer can invite several users, distribute the cost, and create a natural acquisition loop. The room also provides a stable boundary for permissions, history, AI context, and eventually cohort analytics.

**What must be added:** Frictionless invitation links, pending invitations, templates, onboarding, collaborator-free pricing, and room-level activation analytics.

### Edge 2: A single multimodal review context

Notes, annotated PDFs, whiteboards, comments, AI practice, and presentation state coexist in the same permissioned room.

**Why it matters:** The integrated workflow reduces context switching and preserves the relationship among explanation, source material, diagram, correction, and practice.

**What must be added:** PDF OCR and semantic selection; citations from source to answer; shared study guides; links among notes, annotations, cards, and quiz items; and import/export.

### Edge 3: Resilient collaboration

Local IndexedDB updates, Yjs synchronization, reconnection review, conflict handling, and immutable note versions are unusually serious capabilities for an early study product.

**Why it matters:** Poor or intermittent connectivity is not just an inconvenience in collaborative software; it creates distrust. Reliability can become a meaningful Philippine-market reputation advantage.

**What must be added:** Cold offline startup, mobile/PWA behavior, complete observability, data-loss service objectives, backup drills, incremental Yjs persistence, and clear recovery UX.

### Edge 4: Accountability and facilitation

Owners, editors, viewers, immutable versions, comments, and presenter/follower behavior can support instructor-led or peer-led sessions.

**Why it matters:** This is closer to how a review center or organized cohort works than a purely personal study tool.

**What must be added:** Cohort rosters, instructor controls, content locking, assignments, attendance/session analytics, progress dashboards, and administrator roles.

### Edge 5: Privacy-conscious AI boundaries

AI generation is explicit, bounded in input/output, structured, invoked from a selected note snapshot, and configured not to store the API request. Saved outputs are private by default.

**Why it matters:** Predictable boundaries are preferable to an invisible assistant reading everything in a medical-education workspace.

**What must be added:** Source citations, shared-output permissions, retention disclosure, model/provider controls, evaluation datasets, instructor review, and a clear policy for sensitive information.

### What is not an edge

The following should not be presented as moats:

- AI summaries, quizzes, or flashcards
- Rich-text notes
- PDF annotation alone
- A whiteboard alone
- Public study rooms
- Realtime cursors
- Using a modern AI model

These are table stakes or easily replicated. BoardPrep’s advantage must come from the **vertical workflow, accumulated cohort state, trusted reliability, outcome data, and distribution relationships**.

### Potential long-term moat

If validation succeeds, defensibility could emerge from:

1. Exam-specific collaborative templates and workflows that encode how successful cohorts prepare
2. A consented graph connecting curriculum topics, group artifacts, practice behavior, and mastery
3. Review-center and school relationships that lower acquisition cost and raise switching cost
4. A reputation for reliable collaboration under unstable connectivity
5. Historical cohort content, corrections, and analytics that institutions do not want to reconstruct elsewhere

Without those assets, large horizontal tools can reproduce the feature set.

---

## 8. Positioning and business model

### Recommended positioning

> **For Philippine licensure cohorts and review centers, BoardPrep is the live study room that keeps shared notes, review PDFs, whiteboards, presenter-led sessions, and AI practice in one recoverable workspace—unlike individual flashcard apps or generic productivity suites.**

Suggested short line:

> **One room. One source of truth. Exam-ready together.**

### What not to say

- “The all-in-one AI study app” — broad, undifferentiated, and easy to compare feature by feature.
- “Replace Quizlet” — BoardPrep is not yet stronger at flashcards or adaptive practice.
- “Replace your review center” — review centers should be a channel and buyer.
- “AI guarantees better scores” — unsupported and unsafe, especially in medical education.

### Pricing architecture to test

| Plan                   |          Proposed price test | Included value                                                                                                      | Strategic purpose                                                    |
| ---------------------- | ---------------------------: | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Free                   |                           ₱0 | Two active rooms, five members per room, modest storage/PDF limit, 10 AI packs/month                                | Let any organizer experience the collaborative loop and invite peers |
| Organizer Pro          |    ₱199/month or ₱1,490/year | More active rooms, longer history, exports, higher storage, approximately 100 AI packs/month, advanced recovery     | Monetize the person who coordinates; collaborators remain free       |
| Cohort / Review Center | ₱4,990/month or ₱59,900/year | Up to approximately 250 learners, cohort administration, templates, analytics, controls, branding, priority support | Create sustainable B2B2C economics and concentrated distribution     |
| Institution            |                       Custom | SSO, audit controls, data-processing terms, advanced administration, support commitments                            | Only after security/compliance and enterprise demand are proven      |

These are test prices. Plan limits should be adjusted from observed storage, realtime, AI, and support costs. Avoid “unlimited” promises until usage distributions are known.

### Why collaborators should be free initially

- Every paid organizer can acquire four or more users.
- Charging every learner creates group coordination and collection friction.
- Students face strong free substitutes and may already pay a review center.
- The organizer receives disproportionate value from administration and history.
- B2B2C contracts can monetize the entire cohort without requiring individual checkout.

### Alternative revenue streams

Prioritize subscription revenue first. Later options include:

- Paid exam-template packs created with credible educators
- Instructor and reviewer revenue sharing
- Institution analytics and administration
- Additional storage or AI usage
- Continuing-professional-development cohorts

Do not launch a public content marketplace early. It adds copyright, moderation, quality-control, and marketplace-liquidity problems before the core product is validated.

---

## 9. Unit economics and financial feasibility

### AI inference

The current code limits AI input to roughly 18,000 characters and output to 3,500 tokens, using `gpt-5-mini` by default. Using OpenAI’s published GPT-5 mini launch price of **US$0.25 per million input tokens and US$2.00 per million output tokens** ([OpenAI](https://openai.com/index/introducing-gpt-5-for-developers/)), a deliberately conservative maximum of 4,500 input tokens plus 3,500 output tokens would cost approximately:

- **US$0.0081 per maximum-size generation**
- **₱0.47** at an assumed ₱58/US$1 exchange rate
- **₱47** for 100 maximum-size generations

This is an illustrative ceiling based on a published price benchmark and an assumed character-to-token conversion. Actual prompts, cached input, output length, exchange rates, and model pricing will vary.

### Infrastructure

Supabase publicly lists a Pro plan beginning at **US$25/month**, with included quotas for monthly active users, database size, egress, and storage ([Supabase pricing](https://supabase.com/pricing)). BoardPrep also requires a separately operated Yjs WebSocket service and may incur PDF storage/egress, logs, email, monitoring, backup, and support costs.

The cost risk is therefore not primarily one AI call. It is the combination of:

- Large PDFs and repeated download/egress
- Realtime connections and full-state persistence
- High-frequency AI usage without quotas
- Customer support for sync, permissions, and recovery
- Security/compliance work for institutions
- Seasonal acquisition and churn

### Margin target

A software gross margin of **80–90%** is plausible if storage, egress, and AI are metered and the realtime architecture is improved before scale. It remains an assumption until live usage is measured.

As an illustrative planning case, if fixed operating expense were ₱250,000 per month and gross margin were 85%, cash operating break-even would require approximately **₱294,000 MRR**. This sits below the base three-year scenario but above the conservative case. The calculation excludes taxes, financing, founder opportunity cost, and growth investment.

### Metrics needed before trusting the model

- AI cost per active room and per retained paid account
- PDF storage and egress per room
- WebSocket compute and persistence cost per collaborative hour
- Support minutes per activated cohort
- Payment fees, refunds, and delinquency
- Customer-acquisition cost by organizer, ambassador, and review-center channel
- Paid gross retention and seasonal reactivation
- Gross margin by consumer and B2B plan

---

## 10. Go-to-market strategy

### Beachhead motion: organizer-led PNLE rooms

Recruit the people who already organize study behavior:

- Study-group leaders
- Class officers and student-organization officers
- High-performing peer tutors
- Nursing content creators
- Review-center lecturers and coordinators
- Faculty who conduct mock reviews

Give each champion a preconfigured PNLE room, onboarding help, and a simple invitation link. The room itself should demonstrate value within the first session.

### Product-led acquisition loop

1. An organizer chooses a PNLE template.
2. BoardPrep creates the room, topic blueprint, first review agenda, and starter quiz.
3. The organizer invites four to eight learners.
4. Learners join a live review and contribute to notes, PDFs, or the whiteboard.
5. The room generates shared practice and highlights weak topics.
6. Invitees create the next subject or exam room.

The current product supports steps 3–4 only partially. Templates, invitations, shared practice, mastery, and analytics are necessary to complete the loop.

### B2B2C motion: review centers

Position BoardPrep as the **collaborative cohort layer** for a review center, not as its content competitor.

Pilot proposition:

- A branded room per cohort or subject
- Instructor-controlled notes and annotated PDFs
- Presenter-led online review sessions
- Learner collaboration between lectures
- AI practice grounded in approved course material
- Cohort engagement and weak-topic analytics
- Exportable outcome and usage summaries

Begin with three design partners. Provide high-touch onboarding in exchange for weekly feedback, permission to measure outcomes, and a paid conversion decision at the end of the pilot.

### Channels

- Direct outreach to nursing review centers and nursing-school programs
- Campus ambassadors paid on activated, retained cohorts rather than raw signups
- Partnerships with student nursing organizations
- Short-form demonstrations on Facebook, TikTok, and YouTube showing a real review-room workflow
- Exam-specific template pages that can rank for subject and review queries
- Referral incentives for organizers whose invited room reaches a collaboration threshold
- Carefully moderated community participation in relevant forums and groups

Avoid broad paid acquisition until room retention and paid conversion are known. A low-cost signup that never becomes a collaborative room has little value.

### Seasonal strategy

Licensure preparation is seasonal. Product and revenue planning should include:

- Exam-season passes or annual plans that cover multiple review phases
- Early-stage diagnostic and planning templates before intensive review begins
- Post-exam archive/export and referral prompts
- Expansion into the next exam category to smooth seasonality
- Review-center annual contracts rather than candidate-only monthly subscriptions
- Continuing-professional-development use cases after licensure

---

## 11. Product roadmap for commercial validation

### P0 — required before a paid beta

1. **Product analytics:** Define anonymous and account-level events for activation, invitations, surface usage, collaboration, retention, AI cost, and failure states.
2. **Invitations:** Shareable links, pending email invitations, clear join flow, invite attribution, and roster administration.
3. **Billing and entitlements:** Checkout, plan state, quotas, receipts, cancellation, grace periods, and administrator visibility.
4. **Production reliability:** Short-lived WebSocket tickets, distributed rate limits, log redaction, sync observability, backups, recovery drills, and documented incident procedures.
5. **Privacy operations:** Privacy notice, terms, retention schedule, account and room deletion, user export, vendor disclosures, and privacy-impact assessment.
6. **Onboarding:** Create a useful PNLE room in under five minutes and teach the organizer how to invite and run the first session.

### P1 — required to prove product-market fit

1. PNLE room templates organized by exam blueprint and subject
2. Shared AI guides/decks with room permissions and version history
3. PDF OCR, semantic selection, and traceable source citations
4. Spaced retrieval, exam countdown, mastery tracking, and weak-topic views
5. Group question sessions and answer analytics
6. PWA/service worker for cold offline startup and stronger mobile ergonomics
7. Notifications and review reminders controlled by the learner
8. Imports from common note, PDF, and flashcard formats; useful exports to reduce lock-in fear

### P2 — required for review-center expansion

1. Organization, cohort, instructor, and learner roles
2. Bulk roster import and lifecycle administration
3. Content approval, locking, assignment, and scheduling
4. Instructor and administrator dashboards
5. Branding and reusable cohort templates
6. Organization-wide exports, audit trails, and support controls
7. SSO and contractual security features when demanded

### P3 — defer until retention is proven

- Public content marketplace
- Large-scale public-room discovery
- Native mobile applications, unless PWA data shows a clear limitation
- Cross-country exam content
- Complex social feeds or gamification
- Institution-wide LMS replacement

The roadmap should optimize for one proof: **retained cohorts who collaborate and pay**. Feature breadth is secondary.

---

## 12. 90-day validation program

### Weeks 1–2: problem and buyer discovery

Conduct 30 structured interviews:

- 15 current or recent PNLE candidates
- 5 study-group organizers
- 5 review-center instructors or administrators
- 5 nursing faculty/program administrators

Ask about the most recent review cycle before showing the product:

- Which tools and files were used?
- Who organized the group, and how much time did that take?
- What was lost, duplicated, outdated, or misunderstood?
- How did the group know what was covered or weak?
- What happened when connectivity failed?
- Which review products were purchased, by whom, and why?
- What would make the group switch from its current stack?
- Who could approve a purchase, at what budget, and on what timeline?

**Evidence threshold to continue:**

- At least 60% use three or more tools in the review workflow.
- At least 40% collaborate on study material weekly during intensive review.
- At least 30% rank coordination, version loss, or material fragmentation among their three most painful problems.
- At least 20% of qualified organizers accept a deposit/preorder offer, or at least three review centers sign a concrete pilot letter of intent.

### Weeks 3–4: message and price testing

Create three exam-specific landing propositions:

1. **One live room for the whole PNLE group**
2. **Shared study that survives weak connections and accidental overwrites**
3. **Turn the group’s approved notes into cited practice and weak-topic review**

Test organizer price points of ₱99, ₱199, and ₱399 per month. Use real checkout intent, refundable deposits, or clearly explained preorders where operationally and legally appropriate.

**Suggested threshold:** At least 500 qualified visitors, 12% signup intent, and 3% deposit/preorder conversion. Traffic must come from actual nursing-review audiences; generic social traffic would distort the result.

### Weeks 5–8: concierge cohort beta

Onboard 10 cohorts totaling 50–100 learners. Manually configure rooms and attend early sessions to understand behavior. Instrument before recruiting.

Define activation as:

> A new room invites at least two accepted collaborators and uses at least two collaborative surfaces within 24 hours.

**Suggested thresholds:**

- Activation rate ≥45%
- Invite acceptance ≥55%
- Median time to first collaborator <24 hours
- Week-four retained rooms ≥30%
- At least three active members per retained room
- At least two collaborative sessions per retained room per week
- Repeat practice use rather than one-time AI generation
- Zero severe data-loss or cross-room access incidents

### Weeks 9–12: willingness-to-pay test

- Make 20 direct paid offers to qualified organizer cohorts; target ≥20% conversion.
- Deliver five formal review-center proposals; target at least two paid pilots.
- Require a payment method or signed pilot agreement, not verbal enthusiasm.
- Interview lost deals and churned cohorts immediately.

### Decision gates

**Go:** Continue investing if week-four room retention is at least 30%, collaborative depth is sustained, reliability is acceptable, and either organizer payment or two B2B pilots validate the economic buyer.

**Iterate:** Continue only with a defined correction if activation is strong but retention is weak, or if cohorts retain but the proposed buyer will not pay.

**Pivot/stop:** Reject the current thesis if fewer than 20% of activated rooms retain at week four after high-touch onboarding, no qualified buyers pay, group behavior does not repeat, or most value comes from individual one-time AI outputs.

---

## 13. KPI framework

### North-star metric

**Weekly Exam-Ready Rooms:** The number of rooms in a week with at least three active members, at least two collaborative sessions, and at least one completed retrieval-practice action.

This metric combines the product’s group thesis with an outcome-oriented learning behavior. It should not count passive logins or a single AI generation.

### Activation

- Room-created-to-first-invite conversion
- Invite acceptance rate
- Time to first collaborator
- Percentage of rooms using at least two surfaces in 24 hours
- Percentage completing the first template agenda

### Engagement and collaboration

- Weekly active rooms and members
- Active collaborators per room
- Collaborative sessions per room
- Shared artifact edits per active member
- Percentage of rooms using two or more surfaces weekly
- Presenter-led session frequency and attendance

### Learning loop

- Quiz or flashcard completion rate
- Repeat retrieval sessions per learner
- Scheduled practice completion
- Weak-topic identification and subsequent improvement
- Percentage of AI outputs with opened source citations
- Instructor corrections to generated material

### Retention

- Week-one, week-four, and week-eight retained-room cohorts
- Organizer retention versus collaborator retention
- Seasonal reactivation for the next subject or exam
- Paid gross and net revenue retention

### Monetization

- Qualified free-to-paid organizer conversion
- Review-center pilot-to-contract conversion
- Average revenue per paid organizer and organization
- Expansion and contraction revenue
- Refund and involuntary-churn rates

### Economics and reliability

- Gross margin and variable cost per active room
- AI, PDF egress, storage, and realtime cost per retained account
- Sync error and recovery rates
- Severe data-loss incidents
- AI request failure and refusal rates
- Permission or cross-room access incidents
- Support time per cohort

---

## 14. Risk register

| Risk                                          | Likelihood | Impact | Early indicator                                              | Mitigation                                                                                                                         |
| --------------------------------------------- | ---------- | ------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Free substitute stack is good enough          | High       | High   | Interviewees see no switching value                          | Lead with exam templates, one-room workflow, reliability, and outcome tracking; target organizers and B2B buyers                   |
| Student willingness to pay is weak            | High       | High   | High usage but low checkout intent                           | Make collaborators free; test seasonal/annual organizer plan; shift economics to review centers                                    |
| AI features commoditize further               | High       | High   | Competitors match outputs quickly                            | Treat AI as infrastructure; differentiate on source traceability, workflow, mastery, and cohort data                               |
| No measurable learning outcome                | High       | High   | Rooms become passive repositories                            | Add scheduled retrieval, question analytics, weak-topic tracking, and exam blueprint                                               |
| Seasonal churn                                | High       | Medium | Usage collapses after the exam                               | Annual B2B contracts, multiple exam verticals, semester workflows, and professional development                                    |
| Mobile and weak-connectivity friction         | Medium     | High   | Low invite acceptance or session failure on phones           | PWA, cold offline startup, mobile-first QA, sync telemetry, and low-bandwidth modes                                                |
| Yjs persistence does not scale                | Medium     | High   | Large room states, slow loads, write amplification           | Incremental updates, compaction, load testing, capacity alarms, and archival policy                                                |
| Security or privacy incident                  | Medium     | High   | Permission anomalies or sensitive content in logs            | Privacy impact assessment, least privilege, tickets instead of query tokens, redaction, retention/deletion, incident response      |
| Medical-study hallucination                   | Medium     | High   | Instructor corrections or unsafe confidence                  | Source citations, constrained outputs, evaluation sets, instructor controls, visible uncertainty; disclaimer alone is insufficient |
| Copyright infringement in shared/public PDFs  | Medium     | High   | Takedown requests or unauthorized libraries                  | Private-by-default rooms, rights terms, reporting/takedown process, access controls, moderation before public discovery            |
| Distribution does not emerge                  | High       | High   | Activated cohorts only come from founder outreach            | Campus champions, review-center partnerships, invitation attribution, exam-template SEO, and referral experiments                  |
| Review centers view BoardPrep as a competitor | Medium     | High   | Partnership rejection due to content concerns                | Sell workflow and engagement infrastructure; preserve center branding and content control                                          |
| SaaS operations are immature                  | High       | High   | Manual plan access, missing usage records, support confusion | Complete P0 billing, analytics, quotas, observability, backups, and runbooks before paid scale                                     |

---

## 15. Privacy, trust, and regulatory readiness

BoardPrep may process educational records, learner behavior, private notes, and potentially health-related content. The Philippine Data Privacy Act defines protections for personal and sensitive personal information ([National Privacy Commission](https://privacy.gov.ph/data-privacy-act/)). The NPC’s online-learning guidance emphasizes adequate platform protections, transparency, legitimate purpose, proportionality, and secure submission practices ([NPC online-learning guidance](https://privacy.gov.ph/online-learning-guidelines-issued-to-help-protect-student-privacy-and-reduce-data-breaches-in-schools/)). Its compliance guidance frames governance around appointment, privacy-impact assessment, privacy management, breach management, and continuing improvement ([NPC five pillars](https://privacy.gov.ph/5-pillars-of-compliance-2/)).

Before paid institutional use, BoardPrep should document:

- Data inventory, purposes, lawful basis, and retention per data class
- Roles of BoardPrep, schools, review centers, Supabase, OpenAI, hosting, email, and monitoring vendors
- Privacy notice and just-in-time disclosures for AI processing
- User access, correction, export, and deletion workflows
- Organization offboarding and cohort-data ownership
- Cross-border processing and vendor contractual terms
- Role-based access tests, auditability, backup encryption, secrets management, and incident response
- Age policy and parental/guardian handling if minors can use the platform
- Rules prohibiting unnecessary patient-identifiable or clinical personal data
- Copyright/takedown and acceptable-use processes

UNESCO’s generative-AI guidance also highlights data privacy, age-appropriate use, human agency, and the unreliability of generated output ([UNESCO guidance](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research)). A medical disclaimer is useful but does not replace source grounding, evaluation, privacy controls, or human review.

This section is business-risk analysis, not legal advice. Philippine counsel and a qualified privacy professional should review the production model before institutional launch.

---

## 16. Strategic alternatives

### Option A: Generic consumer study app

**Assessment:** Do not pursue now.

The market is crowded, consumer willingness to pay is pressured by free tools, acquisition is expensive, and BoardPrep lacks the content network, personal mastery engine, mobile maturity, and brand of established competitors.

### Option B: PNLE collaborative study-room SaaS

**Assessment:** Recommended validation path.

The current product is naturally aligned, the pain is time-bound and high stakes, group invitation can support product-led growth, and nursing offers a coherent community and partner set.

### Option C: Review-center cohort platform

**Assessment:** Pursue alongside Option B as the preferred economic model.

The sales cycle is longer, but centers own distribution and already monetize review. BoardPrep must add administration, analytics, source governance, privacy readiness, and reliability commitments.

### Option D: White-label institutional collaboration tool

**Assessment:** Defer.

Institutional deals demand SSO, procurement, security review, service levels, integrations, and support. Enter only after smaller center pilots establish a repeatable workflow.

### Option E: Public study-material marketplace

**Assessment:** Defer or avoid.

Content networks can create defensibility, but cold-start, copyright, moderation, quality, cheating, and trust risks would distract from the core validation.

---

## 17. Recommended next steps

### Immediate, next seven days

1. Adopt the focused positioning and create one PNLE-specific prototype room.
2. Define the event taxonomy and north-star metric before recruiting beta users.
3. Prepare a neutral interview script and recruit the first 15 candidates and five organizers.
4. Build a simple invitation link flow and remove exact-email setup friction.
5. Draft a one-page review-center pilot offer with a paid decision date.
6. Create a data/privacy inventory and identify production blockers around WebSocket tokens, logs, deletion, and retention.

### Next 30 days

1. Complete 30 interviews and publish an evidence table of pains, frequency, present alternatives, buyer, and payment signals.
2. Run the three-message and three-price landing test.
3. Instrument activation, collaborative depth, retention, reliability, and variable costs.
4. Implement billing only far enough to make a real payment or deposit test.
5. Recruit three review-center design partners and ten beta cohorts.

### Next 90 days

1. Complete the concierge beta and paid tests.
2. Build only the P0/P1 capabilities tied to observed activation and retention blockers.
3. Produce weekly cohort reviews using the KPI framework.
4. Make an explicit go, iterate, or stop decision against the thresholds in this report.
5. If successful, expand from PNLE into one adjacent health exam before entering LET or general higher education.

---

## 18. Further questions that primary research must answer

### Problem and behavior

- Do cohorts genuinely co-author study material, or do most learners only consume one organizer’s work?
- Is version/recovery pain frequent enough to influence switching, or merely appreciated after purchase?
- Which artifact anchors the workflow: PDF, notes, whiteboard, video, or question bank?
- Are synchronous sessions central, or is asynchronous review the dominant behavior?
- What causes a study group to stop meeting?

### Buyer and willingness to pay

- Who actually feels enough pain to pay: learner, organizer, parent, instructor, center, or school?
- Is an annual organizer plan preferable to an exam-season pass?
- Can review centers charge BoardPrep into their existing tuition, or must it create measurable savings/revenue?
- What procurement and privacy requirements appear even in small centers?

### Product

- Does presenter/follower behavior materially improve sessions?
- Do users trust AI only when every output links to an approved source?
- Is shared practice more valuable than private saved guides?
- What is the minimum useful mastery loop?
- Is a PWA sufficient, or does native mobile become necessary?

### Distribution

- Can one organizer reliably invite and activate four or more peers?
- Which communities permit product demonstrations and referrals?
- Will nursing educators co-create credible templates?
- Can review centers become channel partners without feeling disintermediated?

### Outcomes

- Does BoardPrep increase completed retrieval sessions, not just time in app?
- Can weak-topic analytics predict where the cohort needs review?
- Are learning gains measurable without making unsupported pass-rate claims?
- What evidence is credible enough for an institution to renew?

---

## 19. Final verdict

**Canvas is worth validating as a focused vertical SaaS.** The product has a real conceptual edge where high-stakes groups need to study together across notes, PDFs, whiteboards, and practice while preserving shared work. The Philippine licensure market is large enough to support a meaningful business, nursing is a coherent first niche, and review centers offer a credible buyer and distribution path.

However, the business is not yet validated. The strongest current features are technical and workflow capabilities; there is no evidence yet of retained cohorts, willingness to pay, low-cost acquisition, or learning improvement. A broad “AI study app” launch would expose the product to entrenched, often free competitors before it has a defensible learning loop or channel.

The correct decision is:

> **Proceed with a 90-day paid validation of “the collaborative command center for PNLE cohorts,” while building only the SaaS, reliability, invitation, source-grounding, and mastery capabilities required to test that thesis.**

If cohorts retain and organizers or centers pay, BoardPrep can expand across Philippine professional examinations. If the group loop does not repeat, the team should stop treating collaboration breadth as an advantage and reconsider whether the product belongs in personal study, institutional delivery, or another category.

---

## 20. Methodology, assumptions, and caveats

### Methodology

This assessment combined:

- A repository and architecture audit of implemented capabilities and disclosed limitations
- Local engineering verification of the present working tree
- Official Philippine examination and higher-education statistics
- Public competitor feature and pricing pages
- Research syntheses on collaborative learning, retrieval practice, and generative AI in education
- Directional public community discussions
- Transparent bottom-up market and unit-economics scenarios

### Local verification completed

The following commands passed on July 18, 2026:

- `npm run typecheck`
- `npm run lint`
- `npm run verify:phase-3`
- `npm run verify:phase-4`
- `npm run verify:offline-sync`
- `npm run verify:conflict-review`
- `npm run verify:password-reset`
- `npm run build`

These tests support engineering readiness claims only. They do not validate production scale, security, accessibility, market demand, retention, or payment.

### Material caveats

- No production analytics, user interviews, sales data, retention data, or revenue were available.
- PRC examinee figures are exam events and may not represent unique individuals.
- Group size, reachable share, price, B2B account count, exchange rate, fixed cost, and gross margin are explicit assumptions.
- Market-size outputs are scenario calculations, not forecasts or audited market estimates.
- Public competitor features and prices can change and may vary by geography or promotion.
- Community posts are qualitative hypotheses, not representative research.
- Educational research supports collaboration and retrieval practice generally; it does not prove BoardPrep improves exam performance.
- The current working tree contains changes that may not represent a committed production release.
- Compliance discussion is not legal advice.
- Revenue potential could be materially lower if cohorts prefer free tool bundles, or higher if review-center and international contracts prove repeatable.

### Confidence by conclusion

| Conclusion                                                 | Confidence  | Reason                                                                                    |
| ---------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| The product has a differentiated integrated group workflow | High        | Direct repository evidence and competitor comparison                                      |
| Nursing is the best first vertical                         | Medium-high | Product alignment and exam/review evidence; no interviews yet                             |
| Organizer/review center is the right payer                 | Medium      | Strong business logic; payment untested                                                   |
| ₱1,490 annual organizer pricing will work                  | Low         | Scenario assumption requiring real checkout tests                                         |
| The PRC market can support a meaningful small SaaS         | Medium      | Official volume plus transparent assumptions                                              |
| The current product will retain cohorts                    | Low         | No behavioral data                                                                        |
| The product can become defensible                          | Medium-low  | Requires vertical data, workflow depth, reliability, and distribution not yet established |

---

## 21. Selected sources

### Philippine market and review category

- [PRC 2024 Annual Report](https://www.prc.gov.ph/sites/default/files/2024%20PRC%20Annual%20Report%20%281%29.pdf)
- [CHED statistics portal](https://ched.gov.ph/statistics/)
- [CHED higher-education institutions, 2023–24](https://ched.gov.ph/wp-content/uploads/Higher-Education-Institution-by-Region-Sector-and-Institutional-Type_2023-2024.pdf)
- [PIDS analysis of Philippine higher education](https://pidswebs.pids.gov.ph/CDN/document/pidsdps2441.pdf)
- [PRC May 2024 PNLE result](https://www.prc.gov.ph/node/6944)
- [PRC November 2024 PNLE result](https://www.prc.gov.ph/node/7209)
- [PRC November 2025 PNLE result](https://www.prc.gov.ph/index.php/article/november-2025-nurses-licensure-examination-results-released-fifteen-15-working-days)
- [PRC March 2026 LET result](https://prc.gov.ph/article/march-2026-licensure-examination-professional-teachers-results-released-thirty-nine-39)
- [CEVAS nursing review](https://www.cevasphilippines.com/cevas-nursing-nle-review-center)
- [ACTS review-center FAQ](https://actsreviewcenter.com/faqs/)
- [Carl Balita Review Center](https://drcarlbalitareviewcenter.com/)

### Competitors and infrastructure

- [Quizlet plans](https://quizlet.com/upgrade)
- [Knowt plans](https://knowt.com/plans?tab=Student+Ultra)
- [RemNote pricing](https://www.remnote.com/pricing)
- [NotebookLM limits and plans](https://support.google.com/notebooklm/answer/16213268)
- [Miro pricing](https://miro.com/pricing/)
- [Miro Education plan](https://help.miro.com/hc/en-us/articles/360017730473-Education-plan)
- [Notion for education](https://www.notion.com/help/notion-for-education)
- [Goodnotes pricing](https://www.goodnotes.com/pricing)
- [Microsoft OneNote Education](https://www.microsoft.com/en/education/products/onenote)
- [Google Workspace realtime editing](https://workspace.google.com/intl/en_uk/resources/real-time-editing/)
- [Studocu](https://www.studocu.com/en-us)
- [Study Together](https://www.studytogether.com/)
- [Brainscape pricing](https://www.brainscape.com/pricing?pack_id=22673357&paywall=private_access_code)
- [Supabase pricing](https://supabase.com/pricing)
- [OpenAI GPT-5 developer announcement and benchmark pricing](https://openai.com/index/introducing-gpt-5-for-developers/)

### Learning, AI, privacy, and trust

- [Second-order cooperative-learning meta-analysis](https://doi.org/10.1007/s12144-025-08943-0)
- [Technology-supported collaborative-learning meta-analysis](https://www.nature.com/articles/s41599-025-05766-z)
- [Retrieval-practice classroom review](https://eric.ed.gov/?id=EJ1319572)
- [Quizzing meta-analysis](https://pubmed.ncbi.nlm.nih.gov/33683913/)
- [Learning-technique meta-analysis](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2021.581216/full)
- [HEPI Student Generative AI Survey 2025](https://www.hepi.ac.uk/reports/student-generative-ai-survey-2025/)
- [UNESCO generative-AI guidance](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research)
- [Philippine Data Privacy Act](https://privacy.gov.ph/data-privacy-act/)
- [NPC online-learning privacy guidance](https://privacy.gov.ph/online-learning-guidelines-issued-to-help-protect-student-privacy-and-reduce-data-breaches-in-schools/)
- [NPC five pillars of compliance](https://privacy.gov.ph/5-pillars-of-compliance-2/)
