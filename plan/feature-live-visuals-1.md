# Live activity visuals: design

Status: all three stages built on 2026-11-25.
Builds on [feature-live-activities-1.md](feature-live-activities-1.md).

## Intent

The user wants each live question type to look and work like Mentimeter's, for
example a word cloud shaped like a cloud. Follow Mentimeter's layouts and
interactions. Keep Qollab's fonts, logo and panels; copy no Mentimeter branding
or artwork.

## Decided by the user

- Answers use many colours, one per answer.

## Answer colours

In order, for up to six answers: blue `#2563eb`, teal `#0f9488`, amber
`#d97706`, pink `#db2777`, purple `#6b21a8`, olive `#4d7c0f`. They belong in
`theme/qollab-workshop.ts` as tokens, not in components.

Checked on a light background with the dataviz validator: any two neighbours,
in a row or around a donut, at every count from two to six, score at least 12.3
under simulated red-green colour blindness (target 8) and 18.1 in normal vision
(floor 15). All have at least 3:1 contrast. Red is left out because it means an
error; the correct answer is marked with a tick and the word "Correct".

Colours that are not neighbours can be closer (13.3 in normal vision), so every
mark on the 2×2 grid carries its name. Word-cloud words are 20px bold or larger,
because 3:1 is only enough for large text.

## Proposed, by type

| Type             | Results                                            | Answering                                                                       |
| ---------------- | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| Word cloud       | Packed cloud, most common word largest and central | Same                                                                            |
| Multiple choice  | Columns with counts; optional donut, pie, dots     | Large coloured choices                                                          |
| Quiz             | Large countdown, then columns, then leaderboard    | Large coloured choices                                                          |
| Open ended       | Speech bubbles or auto-scrolling grid              | Same                                                                            |
| Scales           | Distribution hill per line, average in a circle    | Drag a slider that starts at "Not rated"                                        |
| Ranking          | Thick bars that slide to their new place           | Up and down buttons                                                             |
| 100 points       | Bars that reorder                                  | −10 and +10 buttons, points left                                                |
| 2×2 grid         | Coloured, named circles                            | Choose an item, then click or drag on the grid; sliders do the same by keyboard |
| Guess the number | Number line with a hill and the answer marked      | Same                                                                            |
| Pin on image     | Pins, optional correct area                        | Same                                                                            |
| Quick form       | Same                                               | Plus email, date, dropdown, required                                            |
| Q&A              | Top question large, next after "answered"          | Same                                                                            |

A full-screen Present view shows one question without the editing panel.

Mentimeter's help pages confirm the chart types, bubbles, scales, ±10 buttons,
reordering and Q&A flow. They do not describe colours, word-cloud arrangement,
the timer or Guess the Number; those are our proposals.

## Constraints

- Each drag has a keyboard alternative. Reduced motion turns animation off.
- A word keeps its colour between updates. Its place follows the votes.
- Privacy, secret answers and run-once rules do not change.

## Stages

1. Present view, word cloud, multiple choice, open ended.
2. Scales, ranking, 100 points, 2×2 grid, guess the number.
3. Quiz flow, Q&A spotlight, form field types, correct area.

## Stage 3 notes

- Quiz: a countdown ring for hosts, students and full screen; "Time's up" when
  it ends; students get a verdict with points and rank once results are shown.
  Guess the number and pin questions get a verdict too.
- Q&A: full screen shows the top open question large. "Mark answered" moves to
  the next.
- Quick form: each field is short text, email, date or pick one, and can be
  required. Types live in `settings.fields`; older forms are all short text.
- Pin on image: an optional correct area in `settings.area`, set while adding
  the question. It is secret until results are shown, and such a question runs
  once per reset, like a quiz.

## Live results on full screen

Decided by the user on 2026-11-25: full screen draws answers as they arrive, as
Mentimeter's default "Instant responses" does. The button there hides them, per
question. Quiz, guess the number and a pin question with a correct area still
wait for "Show results", and form answers never appear. What students see on
their own screens did not change; that button now reads "Show to students".
