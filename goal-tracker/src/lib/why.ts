/**
 * The Why curriculum — the written material behind the Why section of Lock In.
 *
 * Everything in this file is written in our own words. Where it leans on someone else's
 * work, the work is *named* rather than quoted, so nothing here can be mistaken for words
 * a real person said. Same rule as lockIn.ts, applied harder: this section is about
 * something personal, and a fabricated citation would poison it.
 *
 * No AI. Static text, deliberately.
 */

export interface WhyLesson {
  id: string;
  /** Short label for the nav rail. */
  label: string;
  title: string;
  /** Paragraphs. Rendered in order, body type. */
  body: string[];
}

export interface WhyExercise {
  id: string;
  title: string;
  /** One line on what this is for, shown under the title. */
  purpose: string;
  /** How long it honestly takes. Reps skip anything that looks like homework. */
  minutes: number;
  steps: string[];
  /** Written into the journal entry when the rep starts this exercise. */
  prompt: string;
}

/**
 * Outside material on why purpose changes behaviour. These are real, findable works —
 * titles and authors only, with our own one-line summary of the argument. No invented
 * quotations, no invented findings, no page numbers we can't stand behind.
 */
export interface WhySource {
  id: string;
  title: string;
  author: string;
  /** 'book' | 'talk' | 'research' — shapes how it's presented and how much weight it carries. */
  kind: 'book' | 'talk' | 'research';
  /** Our summary of what it argues. Our words, not theirs. */
  takeaway: string;
}

export const WHY_LESSONS: WhyLesson[] = [
  {
    id: 'what',
    label: 'What it is',
    title: 'What a why actually is',
    body: [
      'A why is the specific reason you will knock the next door after the last one slammed. Not a slogan. Not "success." Not "be my best self." Those are not whys — they are wallpaper, and wallpaper does not get you out of the truck at 6pm when it is raining and you are at zero for the day.',
      'A real why has a face, a number, or a date attached to it. "My daughter starts kindergarten in August and I want to be the one who drops her off, which means I need to be off this doorstep by 3pm, which means I need to close in fewer knocks." That is a why. You can test it. It tells you what to do differently on a Tuesday.',
      'The test is simple: if your why does not change a decision you are about to make, it is not your why yet. It is a nice sentence about yourself.',
      'Most people never get past the nice sentence, because the real one is usually embarrassing. It is often about money you do not have, a person you are trying to prove something to, or a version of yourself you are running from. That is fine. Nobody has to read it but you.',
    ],
  },
  {
    id: 'why-it-works',
    label: 'Why it works',
    title: 'Why having one actually changes anything',
    body: [
      'Door-to-door is a job built almost entirely out of rejection. The maths of it means you spend most of your working life being told no by strangers. Nothing about that is naturally motivating, so the motivation has to be imported from somewhere else. That somewhere is the why.',
      'The useful way to think about it: a why converts a rejection from a verdict about you into a toll you are paying toward something specific. Same no, same door, completely different weight. Reps who burn out are usually not the ones getting the most nos — they are the ones who have no exchange rate for them.',
      'This is not a motivational claim invented for this app. It is the core of a fairly deep body of work, from Viktor Frankl writing about surviving the camps by holding onto a reason, to modern research on intrinsic versus extrinsic motivation showing that reasons you own outlast rewards someone else hands you. The Sources tab lists the real books and papers if you want to go further than our summary of them.',
      'The practical version: extrinsic goals — a bonus, a leaderboard, a manager watching — work in short bursts and stop working the moment nobody is watching. Intrinsic ones keep working at 6pm on a Thursday when nobody is watching. Most of this job happens when nobody is watching.',
    ],
  },
  {
    id: 'finding',
    label: 'Finding yours',
    title: 'How to find it if you do not have one',
    body: [
      'Almost nobody can answer "what is your why" cold. It is too big a question and the honest answer feels too small to say out loud. So do not answer it directly — corner it instead.',
      'The reliable method is laddering: start with something you want that is concrete and slightly shallow, then ask why that matters, then why *that* matters, four or five times. The first answer is usually money. The third or fourth is usually the real one, and it usually has a person in it.',
      'Watch for the point where answering gets uncomfortable or you want to change the subject. That discomfort is the signal you have arrived somewhere true. The exercises below are built around that.',
      'One warning: a why built entirely on proving someone wrong burns extremely hot and extremely briefly. It works, right up until the day they admit you were right, and then the fuel is gone and you have nothing. If yours is currently shaped like revenge, keep it — it will get you moving — but keep laddering until you find the thing underneath it.',
    ],
  },
  {
    id: 'keeping',
    label: 'Keeping it',
    title: 'Keeping it alive after week three',
    body: [
      'A why written once and never looked at decays into wallpaper within about a month. This is the failure mode almost everyone hits, and it is not a character flaw — it is just how attention works.',
      'Three things keep one alive. Write it where you will see it before you knock, not in a notebook in a drawer. Attach a number to it so you can tell whether you are gaining on it. And revisit it on a schedule, because whys change — the one you had at 22 will not survive a kid or a mortgage, and that is not failure, that is the point of revisiting.',
      'Rewrite it every quarter. Keep the old versions. Reading back through what used to matter to you is the single most reliable way to notice how far you have actually come, which is the thing this job is worst at showing you.',
    ],
  },
];

export const WHY_EXERCISES: WhyExercise[] = [
  {
    id: 'ladder',
    title: 'The five whys',
    purpose: 'Get past the shallow answer to the one with a person in it.',
    minutes: 10,
    steps: [
      'Write down one thing you want. Money, a truck, a title — shallow is fine, shallow is the point.',
      'Ask: why do I want that? Write the answer.',
      'Ask why again about that answer. Then again. Five times total.',
      'Stop when the answer makes you slightly uncomfortable or you want to move on. That is the one.',
      'Write the last answer as a single sentence. That sentence is your first draft.',
    ],
    prompt: 'What I want, and why — five levels down.',
  },
  {
    id: 'cost',
    title: 'The cost of not doing it',
    purpose: 'Whys built on what you lose are more durable than whys built on what you gain.',
    minutes: 10,
    steps: [
      'Picture yourself three years from now having not changed anything about how you work.',
      'Write what your day looks like. Be specific — the address, the truck, the bank balance, who is in the room.',
      'Write what it costs the people around you, not just you.',
      'Now write the same three years if you did change. Same level of detail.',
      'The gap between those two pages is the thing worth working for.',
    ],
    prompt: 'Three years from now, if nothing changes.',
  },
  {
    id: 'eulogy',
    title: 'The long view',
    purpose: 'Cuts through anything that only matters this quarter.',
    minutes: 15,
    steps: [
      'Write what you would want someone who knew you well to be able to say about how you worked and who you were for people.',
      'Do not write what you want to have owned. Write what you want to have been.',
      'Read it back and mark anything that your current week is actively working against.',
      'Pick one of those marks. That is what to change first.',
    ],
    prompt: 'What I want to have been, not what I want to have owned.',
  },
  {
    id: 'who',
    title: 'Who is counting on you',
    purpose: 'The fastest route to a why, if there is a person in your life.',
    minutes: 5,
    steps: [
      'Name one person whose life is materially different if you do well this year.',
      'Write exactly how it is different. Not "better" — specifically what changes for them.',
      'Write what they would not have if you quit in March.',
      'Put their name somewhere you will see it before the first door.',
    ],
    prompt: 'Who this is actually for, and what changes for them.',
  },
];

/**
 * Real, findable works. Each `takeaway` is our own summary of the argument — never a
 * quotation. If you add to this list, you must have actually been able to name the work
 * and its author with confidence; "I think there's a study that says…" does not go here.
 */
export const WHY_SOURCES: WhySource[] = [
  {
    id: 'frankl',
    title: "Man's Search for Meaning",
    author: 'Viktor E. Frankl',
    kind: 'book',
    takeaway:
      'Frankl, a psychiatrist who survived Nazi concentration camps, argued that people can endure almost any hardship when they hold onto a reason for it, and that meaning is found in what you are responsible to rather than what you are owed. The foundational text on this whole subject, and a short read.',
  },
  {
    id: 'sinek',
    title: 'Start With Why',
    author: 'Simon Sinek',
    kind: 'book',
    takeaway:
      'Argues that people commit to the reason behind what you do rather than the thing itself, and that most organisations and individuals can describe what they do but not why. The popular entry point to the idea.',
  },
  {
    id: 'duckworth',
    title: 'Grit: The Power of Passion and Perseverance',
    author: 'Angela Duckworth',
    kind: 'book',
    takeaway:
      'Makes the case that sustained interest plus persistence predicts long-run achievement better than raw talent does, and that the persistence half is downstream of having a purpose you actually care about.',
  },
  {
    id: 'sdt',
    title: 'Self-Determination Theory (Intrinsic and Extrinsic Motivation)',
    author: 'Edward L. Deci and Richard M. Ryan',
    kind: 'research',
    takeaway:
      'Decades of research distinguishing motivation that comes from inside from motivation supplied by rewards and pressure. The relevant finding for this job: internally owned reasons sustain effort far longer than external incentives, which tend to stop working once the incentive is removed.',
  },
  {
    id: 'pink',
    title: 'Drive: The Surprising Truth About What Motivates Us',
    author: 'Daniel H. Pink',
    kind: 'book',
    takeaway:
      "A readable synthesis of the motivation research, organised around autonomy, mastery and purpose. If the academic version is heavy going, this is the same argument in plain language.",
  },
  {
    id: 'covey',
    title: 'The 7 Habits of Highly Effective People',
    author: 'Stephen R. Covey',
    kind: 'book',
    takeaway:
      'The second habit — begin with the end in mind — is essentially the long-view exercise above, and the book gives it a fuller treatment: decide what you are aiming at before you get efficient at moving.',
  },
  {
    id: 'mcgonigal',
    title: 'The Upside of Stress',
    author: 'Kelly McGonigal',
    kind: 'book',
    takeaway:
      'Argues that how you interpret stress changes what it does to you, and that connecting hard effort to something you care about shifts it from something that grinds you down to something you can carry. Directly relevant to a job made of rejection.',
  },
];

/** Everything, for the search index. */
export function whySearchable(): { id: string; title: string; text: string }[] {
  return [
    ...WHY_LESSONS.map((l) => ({ id: l.id, title: l.title, text: l.body.join(' ') })),
    ...WHY_EXERCISES.map((e) => ({
      id: e.id,
      title: e.title,
      text: `${e.purpose} ${e.steps.join(' ')}`,
    })),
    ...WHY_SOURCES.map((s) => ({
      id: s.id,
      title: s.title,
      text: `${s.author} ${s.takeaway}`,
    })),
  ];
}
