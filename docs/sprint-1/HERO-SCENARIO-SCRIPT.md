# SafeCall Console — Hero Scenario Script

The one deliberate path through the 8 Figma frames — written down and rehearsable, not discovered live. Satisfies the brief's Section 5 requirement for a scripted "play scenario" walkthrough.

**Entry point:** Present mode → flow starting point "Hero scenario — start here" (frame 01)

**Figma file:** [figma.com/design/yir8Q5knbqiqZZcqz0dbSt](https://figma.com/design/yir8Q5knbqiqZZcqz0dbSt)

**Timing:** ~2:30 for the core path (6 steps) · +30s per optional branch · well under the 5-minute ceiling

---

## Step 1 — Fleet is connecting

**Frame:** 01 · Escalation List — Loading

**Narration:** "Console is coming online — connecting to the duress platform, the outage feed, and public hazard feeds."

**Action:** Click Scenario → No escalation (~10s, then advance)

## Step 2 — Fleet at rest

**Frame:** 02 · Escalation List — Empty

**Narration:** "8,000 devices monitored, all reporting normally. This is what the duty coordinator sees on an ordinary shift."

**Action:** Click Scenario → Escalation active (~15s)

## Step 3 — A device goes silent

**Frame:** 03 · Escalation List — Active (Level 0)

**Narration:** "SC-P-4821 — a community nurse's pendant in Ballarat South — has gone silent. Loss-of-connectivity flips to alert red, and the row picks up an Assessing badge."

**Action:** Click the escalation row (~15s)

## Step 4 — Let it sit — the correlator is working

**Frame:** 06 · Escalation Detail — Assessment Pending

**Narration:** "Opening the escalation doesn't hand you an instant verdict. The correlator is actively querying the outage API and public hazard feeds — the evidence toggle is disabled, and there's no recommended action yet, because the console won't guess from partial evidence. Give this a beat before moving on."

**Action:** Click Assessment → Verdict ready (~20–25s pause)

## Step 5 — Verdict lands

**Frame:** 04 · Escalation Detail — Evidence collapsed

**Narration:** "91% confidence: a planned network outage coinciding with an active bushfire warning. The recommended action is advisory only — hold technician dispatch until the maintenance window closes at 16:45."

**Action:** Click Supporting Evidence ▶ (~20s)

## Step 6 — Show the reasoning

**Frame:** 05 · Escalation Detail — Evidence expanded

**Narration:** "Three independent sources, and the correlation trace showing exactly how MSISDN → last known GPS → resolved postcode → outage record → hazard warning chained into that verdict. Nothing here is a black box."

**Action:** Core path ends here — branches below are optional.

### Optional branch A — Degraded feed

**Action:** Click Public feeds → BOM unavailable (~15s)

Lands on 08 · Evidence expanded, feed degraded — the Bureau of Meteorology row reads "NOT RETRIEVED" instead of silently vanishing, and the count drops to "2 of 3 sources." Same screen, same context — this branch is safe to show without narrating a jump.

### Optional branch B — Basemap offline

**Action:** Click Basemap → Offline (~15s)

Lands on 07 · Escalation List — Basemap Offline — the map's own fallback message, device data unaffected.

> **Caveat — narrate the jump.** Frame 07 is built on the list screen, not the detail screen — clicking this branch visibly returns to the escalation list view with the map replaced. Say so before clicking: "let's also step back to the list view to show what happens if the map tile service itself goes down" — don't let it look like a misclick.

---

**Close the loop:** click Scenario → Escalation active from wherever you ended to return to 03 and reset for a repeat run.

## The demo strip

Every screen carries the same demo strip along the bottom, with four independent toggle groups. Each button jumps to whichever frame represents that state — this is what makes every step above possible, and it's also available to explore outside the scripted path if useful.

| Group        | Options                           | What it shows                                                                          |
| ------------ | --------------------------------- | -------------------------------------------------------------------------------------- |
| Scenario     | No escalation / Escalation active | Whether a device has gone silent — 02 (Empty) vs. 03 (List)                            |
| Assessment   | In progress / Verdict ready       | Whether the correlator has finished — 06 (Pending) vs. 04 (Detail)                     |
| Public feeds | All sources / BOM unavailable     | Whether every evidence source responded — 05 vs. 08 (Evidence expanded, feed degraded) |
| Basemap      | Online / Offline                  | Whether the map tile service is reachable — 03 (List) vs. 07 (Basemap Offline)         |

Public feeds and Basemap each resolve to one representative frame rather than combining with whichever other state is currently showing — see the note on frame 07 in Step 6's branch above for the one case where that matters mid-script.
