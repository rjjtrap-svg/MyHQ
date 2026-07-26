/**
 * The Lock In library — a static reference shelf, no AI involved.
 *
 * Two kinds of entry, deliberately labelled differently so nobody is misled about what
 * they're reading:
 *
 *  - kind 'quote'  — words the person actually said or wrote, widely documented. Shown in
 *                    quotation marks.
 *  - kind 'idea'   — a summary of a framework or argument they're known for, written here
 *                    in our own words. Shown without quotation marks and labelled as an
 *                    idea, because putting a paraphrase in quotes would be putting words in
 *                    someone's mouth.
 *
 * If you add to this file, keep that line clean: only use 'quote' when you are confident of
 * the wording, otherwise write it as an 'idea'.
 */

export type EntryKind = 'quote' | 'idea';

export interface LockInEntry {
  id: string;
  kind: EntryKind;
  text: string;
  author: string;
  /** Book, talk or show it comes from, where that's well established. */
  source?: string;
  topics: TopicId[];
}

export type TopicId =
  | 'discipline'
  | 'rejection'
  | 'sales'
  | 'mindset'
  | 'habits'
  | 'money'
  | 'leadership';

export const TOPICS: { id: TopicId; label: string; blurb: string }[] = [
  { id: 'discipline', label: 'Discipline', blurb: 'Doing it when you do not feel like it.' },
  { id: 'rejection', label: 'Rejection', blurb: 'Taking no for a living.' },
  { id: 'sales', label: 'Selling', blurb: 'The craft itself.' },
  { id: 'mindset', label: 'Mindset', blurb: 'How you carry the day.' },
  { id: 'habits', label: 'Habits', blurb: 'The compounding stuff.' },
  { id: 'money', label: 'Money', blurb: 'Value, price and worth.' },
  { id: 'leadership', label: 'Leadership', blurb: 'Carrying other people.' },
];

export const LOCK_IN_ENTRIES: LockInEntry[] = [
  // --- Napoleon Hill ---
  {
    id: 'hill-1',
    kind: 'quote',
    text: 'Whatever the mind can conceive and believe, it can achieve.',
    author: 'Napoleon Hill',
    source: 'Think and Grow Rich',
    topics: ['mindset'],
  },
  {
    id: 'hill-2',
    kind: 'quote',
    text: 'Every adversity, every failure, every heartache carries with it the seed of an equal or greater benefit.',
    author: 'Napoleon Hill',
    source: 'Think and Grow Rich',
    topics: ['mindset', 'rejection'],
  },
  {
    id: 'hill-3',
    kind: 'quote',
    text: 'Patience, persistence and perspiration make an unbeatable combination for success.',
    author: 'Napoleon Hill',
    topics: ['discipline'],
  },
  {
    id: 'hill-4',
    kind: 'idea',
    text: 'Definiteness of purpose: decide exactly what you want and by when, write it down, and read it back to yourself daily. A vague wish produces vague effort.',
    author: 'Napoleon Hill',
    source: 'Think and Grow Rich',
    topics: ['mindset', 'habits'],
  },

  // --- Alex Hormozi ---
  {
    id: 'hormozi-1',
    kind: 'idea',
    text: 'The value equation: perceived value rises with the dream outcome and the odds of achieving it, and falls with the time it takes and the effort it costs. Improve any of the four and the offer gets easier to sell.',
    author: 'Alex Hormozi',
    source: '$100M Offers',
    topics: ['sales', 'money'],
  },
  {
    id: 'hormozi-2',
    kind: 'idea',
    text: 'Make an offer so good people feel stupid saying no. Most price objections are really value problems in disguise.',
    author: 'Alex Hormozi',
    source: '$100M Offers',
    topics: ['sales', 'money'],
  },
  {
    id: 'hormozi-3',
    kind: 'idea',
    text: 'Volume negates luck. Do enough reps and the outliers stop mattering — you cannot get unlucky a thousand times in a row.',
    author: 'Alex Hormozi',
    topics: ['discipline', 'rejection'],
  },
  {
    id: 'hormozi-4',
    kind: 'idea',
    text: 'The person willing to do the unscalable, unglamorous work for longer than anyone else usually wins, because almost nobody is willing.',
    author: 'Alex Hormozi',
    topics: ['discipline'],
  },

  // --- David Goggins ---
  {
    id: 'goggins-1',
    kind: 'idea',
    text: 'The 40% rule: when your mind says you are finished, you are usually only about 40% spent. The governor is mental long before it is physical.',
    author: 'David Goggins',
    source: "Can't Hurt Me",
    topics: ['discipline', 'mindset'],
  },
  {
    id: 'goggins-2',
    kind: 'quote',
    text: "You are in danger of living a life so comfortable and soft that you will die without ever realizing your true potential.",
    author: 'David Goggins',
    source: "Can't Hurt Me",
    topics: ['discipline', 'mindset'],
  },
  {
    id: 'goggins-3',
    kind: 'idea',
    text: 'The accountability mirror: say the hard truth about yourself out loud, to your own face, and then go fix it. Nobody is coming to do it for you.',
    author: 'David Goggins',
    source: "Can't Hurt Me",
    topics: ['discipline', 'habits'],
  },

  // --- Chris Williamson ---
  {
    id: 'williamson-1',
    kind: 'idea',
    text: 'Most people overestimate what they can do in a day and drastically underestimate how much consistency compounds over a year of unremarkable days.',
    author: 'Chris Williamson',
    source: 'Modern Wisdom',
    topics: ['habits', 'discipline'],
  },
  {
    id: 'williamson-2',
    kind: 'idea',
    text: 'Comparison is the thief of joy, but it is also a terrible measuring stick — you are comparing your behind-the-scenes to somebody else’s highlight reel.',
    author: 'Chris Williamson',
    source: 'Modern Wisdom',
    topics: ['mindset'],
  },

  // --- Mel Robbins ---
  {
    id: 'robbins-1',
    kind: 'idea',
    text: 'The 5 Second Rule: the moment you have an instinct to act, count 5-4-3-2-1 and move before your brain talks you out of it. Hesitation is where the impulse dies.',
    author: 'Mel Robbins',
    source: 'The 5 Second Rule',
    topics: ['habits', 'discipline'],
  },
  {
    id: 'robbins-2',
    kind: 'idea',
    text: 'You are never going to feel like it. Motivation is not a prerequisite for action — action is what produces the motivation.',
    author: 'Mel Robbins',
    topics: ['discipline', 'mindset'],
  },

  // --- Sam Taggart (D2D) ---
  {
    id: 'taggart-1',
    kind: 'idea',
    text: 'Door to door is a numbers game only after it is a skills game. Ten more doors fixes a slow day; ten better conversations fixes a slow month.',
    author: 'Sam Taggart',
    source: 'The D2D Association',
    topics: ['sales', 'discipline'],
  },
  {
    id: 'taggart-2',
    kind: 'idea',
    text: 'Your energy at the door is contagious in both directions. If you are dreading the knock, they can hear it before you finish your first sentence.',
    author: 'Sam Taggart',
    topics: ['sales', 'mindset'],
  },

  // --- Lenny Gray (D2D) ---
  {
    id: 'gray-1',
    kind: 'idea',
    text: 'Assume the sale in your posture and your paperwork. Reps who act like the deal is happening close more than reps who act like they are asking permission.',
    author: 'Lenny Gray',
    source: 'Door-to-Door Millionaire',
    topics: ['sales'],
  },
  {
    id: 'gray-2',
    kind: 'idea',
    text: 'The first ten seconds decide most doors. Get past "who are you and why are you here" fast and with warmth, or you never get to the pitch.',
    author: 'Lenny Gray',
    source: 'Door-to-Door Millionaire',
    topics: ['sales'],
  },

  // --- Jordan Belfort ---
  {
    id: 'belfort-1',
    kind: 'idea',
    text: 'Three tens: before anyone buys, they must be sure about the product, sure about you, and sure about the company. A stalled close usually means one of the three is low.',
    author: 'Jordan Belfort',
    source: 'Way of the Wolf',
    topics: ['sales'],
  },
  {
    id: 'belfort-2',
    kind: 'idea',
    text: 'Tonality carries more of the message than the script does. The same words land completely differently depending on certainty in the voice.',
    author: 'Jordan Belfort',
    source: 'Way of the Wolf',
    topics: ['sales'],
  },

  // --- Andy Frisella ---
  {
    id: 'frisella-1',
    kind: 'idea',
    text: 'Keeping promises to yourself is the whole game. Every time you say you will do something and then do not, you teach yourself that your word means nothing.',
    author: 'Andy Frisella',
    source: '75 HARD',
    topics: ['discipline', 'habits'],
  },
  {
    id: 'frisella-2',
    kind: 'idea',
    text: 'Mental toughness is built the same way physical strength is: by doing difficult things on a schedule, especially on the days you have a good excuse not to.',
    author: 'Andy Frisella',
    topics: ['discipline'],
  },

  // --- Zig Ziglar ---
  {
    id: 'ziglar-1',
    kind: 'quote',
    text: 'You can have everything in life you want, if you will just help enough other people get what they want.',
    author: 'Zig Ziglar',
    topics: ['sales', 'leadership'],
  },
  {
    id: 'ziglar-2',
    kind: 'quote',
    text: 'Every sale has five obstacles: no need, no money, no hurry, no desire, no trust.',
    author: 'Zig Ziglar',
    topics: ['sales'],
  },

  // --- Og Mandino / classic sales canon ---
  {
    id: 'mandino-1',
    kind: 'quote',
    text: 'I will persist until I succeed. Always will I take another step. If that is of no avail I will take another, and yet another.',
    author: 'Og Mandino',
    source: 'The Greatest Salesman in the World',
    topics: ['rejection', 'discipline'],
  },

  // --- James Clear ---
  {
    id: 'clear-1',
    kind: 'quote',
    text: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    author: 'James Clear',
    source: 'Atomic Habits',
    topics: ['habits'],
  },
  {
    id: 'clear-2',
    kind: 'idea',
    text: 'Every action is a vote for the type of person you want to become. One knock does not change your life; it casts a vote for being someone who knocks.',
    author: 'James Clear',
    source: 'Atomic Habits',
    topics: ['habits', 'mindset'],
  },

  // --- Carol Dweck (the evidence base under most of the above) ---
  {
    id: 'dweck-1',
    kind: 'idea',
    text: 'Growth mindset: treating ability as trainable rather than fixed changes how people respond to failure. The research finding is real but smaller than the pop version suggests — it helps most for students who are struggling.',
    author: 'Carol Dweck',
    source: 'Mindset',
    topics: ['mindset'],
  },
  {
    id: 'duckworth-1',
    kind: 'idea',
    text: 'Grit — sustained passion and perseverance toward long-term goals — predicts who finishes hard programmes better than talent does. Later research suggests much of its predictive power overlaps with plain conscientiousness.',
    author: 'Angela Duckworth',
    source: 'Grit',
    topics: ['discipline', 'mindset'],
  },
  {
    id: 'cialdini-1',
    kind: 'idea',
    text: 'Six levers of influence: reciprocity, commitment and consistency, social proof, authority, liking, and scarcity. These are among the most replicated findings in persuasion research.',
    author: 'Robert Cialdini',
    source: 'Influence',
    topics: ['sales'],
  },
  {
    id: 'cialdini-2',
    kind: 'idea',
    text: 'Social proof is strongest when the people being cited are similar to the person deciding. "Four of your neighbours on this street" beats "thousands of customers nationwide".',
    author: 'Robert Cialdini',
    source: 'Influence',
    topics: ['sales'],
  },
  {
    id: 'voss-1',
    kind: 'idea',
    text: 'Tactical empathy: name the objection out loud before they do. "It probably feels like this is just another sales pitch" defuses more than arguing the point ever will.',
    author: 'Chris Voss',
    source: 'Never Split the Difference',
    topics: ['sales', 'rejection'],
  },
  {
    id: 'voss-2',
    kind: 'idea',
    text: '"No" is the start of the negotiation, not the end of it. People feel safe once they have said it, which is often when the real conversation begins.',
    author: 'Chris Voss',
    source: 'Never Split the Difference',
    topics: ['rejection', 'sales'],
  },

  // --- Jocko Willink ---
  {
    id: 'jocko-1',
    kind: 'quote',
    text: 'Discipline equals freedom.',
    author: 'Jocko Willink',
    source: 'Discipline Equals Freedom',
    topics: ['discipline'],
  },
  {
    id: 'jocko-2',
    kind: 'idea',
    text: 'Extreme ownership: when the team fails, the leader owns it — every excuse you accept from yourself is one your team learns to make.',
    author: 'Jocko Willink',
    source: 'Extreme Ownership',
    topics: ['leadership'],
  },

  // --- Shawn Ryan ---
  {
    id: 'ryan-1',
    kind: 'idea',
    text: 'The people who come through the worst of it tend to be the ones who kept a routine and kept talking to somebody. Isolation is what turns a hard stretch into a spiral.',
    author: 'Shawn Ryan',
    source: 'Shawn Ryan Show',
    topics: ['mindset', 'habits'],
  },

  // --- Naval Ravikant ---
  {
    id: 'naval-1',
    kind: 'quote',
    text: 'Play long-term games with long-term people.',
    author: 'Naval Ravikant',
    topics: ['money', 'leadership'],
  },
  {
    id: 'naval-2',
    kind: 'idea',
    text: 'You get paid for being right, not for working hard — but you rarely get to be right without a lot of reps first. Specific knowledge is earned, not taught.',
    author: 'Naval Ravikant',
    topics: ['money', 'mindset'],
  },
];

export function entriesForTopic(topic: TopicId): LockInEntry[] {
  return LOCK_IN_ENTRIES.filter((e) => e.topics.includes(topic));
}

/** Case-insensitive search across text, author and source. */
export function searchEntries(query: string): LockInEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return LOCK_IN_ENTRIES;
  return LOCK_IN_ENTRIES.filter(
    (e) =>
      e.text.toLowerCase().includes(q) ||
      e.author.toLowerCase().includes(q) ||
      (e.source ?? '').toLowerCase().includes(q)
  );
}

export const AUTHORS = Array.from(new Set(LOCK_IN_ENTRIES.map((e) => e.author))).sort();
