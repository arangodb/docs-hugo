# Writing rules

These apply to every word written for this repository: docs pages, HTTP API
descriptions, release notes, the README, code comments in examples, commit
messages, and PR descriptions.

Adapted from the `no-ai-slop` skill, plus the Arango house rules and the
Content Guidelines of the repository README.

## House rules (hard)

1. **Less text.** See the section below. When in doubt, cut.
2. **No emoji.** Not in pages, headings, admonitions, code comments, commits or PR text.
3. **No em dashes (—) or en dashes (–).** Use a period, comma, colon or parentheses. Ranges: "10 to 20", "Mon to Fri". A plain hyphen is fine inside compound words ("read-only").
4. **Be concise.** Cut every word that does not change the meaning. One idea per sentence. Button labels: 1 to 3 words. Toasts: one line. Errors: two short sentences at most.
5. **No jargon.** Write for a smart person who does not work on this team. Product names and database terms (collection, document, edge, graph, AQL, shard, replica) are fine because users know them. Internal codenames, acronyms and architecture words are not. If you must use one, explain it in five words the first time.
6. **Sentence case** for new headings. No ALL CAPS. Many existing pages use Title Case, so follow the surrounding pages before changing a heading: headings are link anchors, and renaming one breaks links to it.
7. **Say "you"**, not "the user". Use "we" only when the product is doing something on the user's behalf ("We'll email you when the import finishes").

## Docs content rules

From the Content Guidelines in the repository README:

- American English spelling: _behavior_, not _behaviour_.
- Inclusive language: _work-hours_, not _man-hours_.
- Get to the point on every page. New pages need a lead paragraph (the
  `description` front matter field, see `pages.md`).
- Target end users and the outcome: solutions, not features.
- No jargon or technical abbreviations in headings or the navigation. Define a
  term when you use it in the content.
- Few admonitions. If everything is a callout, nothing stands out.

## Less text

Write as little as possible. Default to no text and add a sentence only when it gives information the reader cannot see or infer: a consequence, a limit, or the cause of an error. Cut sentences that restate a heading or announce what follows.

Cut on sight:

- Subtitles that restate the page title ("Users" / "Manage all the users in your organization")
- Card descriptions that restate the card title
- "This page shows...", "Here you can...", "Use this form to...", "Click the button below to...", "Below you'll find..."
- Helper text that repeats the label ("Email" / "Enter your email address")
- Placeholders that repeat the label. Use an example value instead (`orders`) or nothing
- Tooltips on icons whose meaning is obvious
- Instructions for standard controls (sorting, dragging, selecting)
- Success messages for results the user can already see

## Interface copy

This section applies to UI text and to UI labels quoted in the docs, not to
docs prose. Quote UI labels exactly as the product shows them, in bold:
**Create graph**.

- **Buttons name the result:** "Create graph", "Delete 3 collections", "Save changes". Never "Submit", "OK", "Yes", "Click here", "Learn more" on its own.
- **Errors answer three questions:** what happened, why (if known), what to do now. "Couldn't connect to cluster prod-eu. The token expired. Sign in again." Never "Oops!", "Something went wrong", "Uh oh".
- **Empty states:** what will be here, and the one action that fills it. "No queries saved yet. Save a query from the editor to reuse it here." + button.
- **Confirmations:** the title is the question with the object named ("Delete collection orders?"), the body says what is lost, the buttons are "Delete collection" and "Cancel".
- **Loading:** say what is happening if it takes more than 2 seconds. "Building graph from 3 collections."
- **Success:** brief, and only if the result is not already visible. "Saved." Not "Success! Your changes have been saved successfully!"
- **Numbers:** units and digits, not words. "1,204 documents", "320 ms", "3 of 12".
- **No exclamation marks** except for a rare earned moment (first graph built). Never in errors.
- **Placeholder data must be plausible ArangoDB data:** collection names like `customers`, `orders`, `follows`; counts like 1,204,331 documents; query times like 48 ms. Never Lorem ipsum, John Doe, Acme Corp or Foo/Bar.

## Banned words and phrases

Never use: delve, foster, leverage, utilize, facilitate, empower, streamline, robust, seamless, seamlessly, cutting-edge, state-of-the-art, game changer, paradigm, tapestry, realm, beacon, multifaceted, meticulous, intricate, paramount, transformative, elevate, embark, supercharge, unlock, unleash, harness, ever-evolving, effortless, powerful, comprehensive, holistic, synergy, journey (for a user flow), navigate (meaning "deal with"), landscape (meaning "situation"), "in today's world", "at its core", "it's worth noting", "it's important to note", "when it comes to", "in order to", "the reality is", "let's dive in", "game-changing", "next-level", "best-in-class", "world-class".

Usually empty, cut unless they change the meaning: just, simply, really, actually, truly, basically, literally, fundamentally, importantly, crucially, easily, quickly.

## Patterns to cut

- **"Not X, it's Y" contrasts.** "This isn't a dashboard, it's a command center." Say Y.
- **Throat-clearing.** "Here's the thing", "Let me be clear", "Great question", "Certainly!", "I'd be happy to", "Absolutely!". Start with the content.
- **Colon reveals.** "The best part: it's fast." Write a plain sentence.
- **Superficial -ing tails.** "...highlighting our commitment to quality." Cut, or state the actual consequence.
- **Importance puffery.** "plays a vital role", "marks a pivotal moment", "serves as a testament". State the fact.
- **Weasel sources.** "Studies show", "experts agree". Name the source or cut the claim.
- **Rule of three by reflex.** "Fast, secure, and scalable." Only list what is true and specific.
- **Dramatic fragments.** "Fast. Simple. Powerful." Use a sentence.
- **Recap endings.** "In summary", "Overall", a closing paragraph that repeats the reply. End on the last point.
- **Offers to continue.** "Let me know if you'd like me to...", "Want me to...?", "Feel free to reach out". Stop when done.
- **Formatting slop.** Bold sprinkled through sentences, headers over two-line sections, bullets where one sentence would do, a "Key features" list nobody asked for.

## Claudisms

Source: [claudisms.ai/claudisms.md](https://claudisms.ai/claudisms.md). The full catalog is in `claudisms.md` next to this file. Check every README, doc page and long reply against it. These are the ones that show up most in UI work and replies to developers:

- **Telling the reader what to value.** "worth noting", "worth a look", any "worth [X]", "this matters", "because it matters", "the right way", "the right tool", "the useful part". Show the thing; do not grade it.
- **"real" as an adjective.** "the real problem", "real data", "a real app". Say the specific thing: "measured", "production", or drop it.
- **"honest" / "honestly"** about your own statements. It implies the rest was not.
- **Borrowed metaphors.** "load-bearing", "the engine", "shape" (for structure), "lives" (for where something is), "carries", "holds", "rides along", "hands you", "surface" as a verb, "the physics of", "names" as a verb, "quietly". Use the plain verb: is, has, shows, returns, depends on.
- **Pseudo-reflection.** "sit with", "arriving at", "coming back to", "where I landed", "the thing that got me", "what I keep noticing".
- **Crowned superlatives.** "the one that pays off most", "the best thing you can do", "the whole game", "the only thing that matters", "the entire point". Present things on their merits.
- **Negative parallelism.** "It's not X, it's Y", "Not only X, but Y", "No X. No Y. Just Z." Banned outright.
- **Announcers.** "Here's where it gets interesting", "Let's break it down", "This is where X comes in", "I'm going to cover three things", restating the question before answering. Start with the content.
- **Preamble flattery.** "Great question", "I love that you asked".
- **Consultant words.** "pressure-test", "right-size", "north star", "key takeaways", "lessons learned", "double-click on", "unpack", "lean into", "leverage".
- **Hype and AI vocabulary.** underscore, foster, shed light on, pave the way, pivotal, groundbreaking, testament, navigate, landscape, realm, delve, dive into, compounds, settled.
- **Invented observation.** "most people", "most teams I've seen", "nobody I know". If it was not observed or sourced, cut it.
- **Structure tics.** `---` horizontal rules between sections, "Bold term: explanation" bullet lists, four or more short sentences in a row, a one-liner close that restates the point.

Claudisms.ai allows spaced hyphens (` - `) where an em dash would go. Our rule is stricter for UI: use a period, comma, colon or parentheses.

Also avoid: announcing what a section is about to do instead of doing it, labeling the product ("production-ready", "polished", "intuitive"), and a closing list of next steps nobody asked for.
