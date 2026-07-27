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
  | 'leadership'
  | 'purpose'
  | 'fear'
  | 'resilience'
  | 'consistency';

export const TOPICS: { id: TopicId; label: string; blurb: string }[] = [
  { id: 'discipline', label: 'Discipline', blurb: 'Doing it when you do not feel like it.' },
  { id: 'rejection', label: 'Rejection', blurb: 'Taking no for a living.' },
  { id: 'sales', label: 'Selling', blurb: 'The craft itself.' },
  { id: 'mindset', label: 'Mindset', blurb: 'How you carry the day.' },
  { id: 'habits', label: 'Habits', blurb: 'The compounding stuff.' },
  { id: 'money', label: 'Money', blurb: 'Value, price and worth.' },
  { id: 'leadership', label: 'Leadership', blurb: 'Carrying other people.' },
  { id: 'purpose', label: 'Purpose', blurb: 'The reason underneath the work.' },
  { id: 'fear', label: 'Fear', blurb: 'The door you do not want to knock.' },
  { id: 'resilience', label: 'Coming back', blurb: 'After the bad day, the bad week.' },
  { id: 'consistency', label: 'Consistency', blurb: 'Showing up when it stops being new.' },
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

  // --- Stephen R. Covey, The 7 Habits of Highly Effective People ---
  {
    id: 'covey-1',
    kind: 'idea',
    text: 'Be proactive. Between what happens to you and how you respond there is a gap, and the whole of your freedom lives in that gap. A slammed door is a stimulus; what you carry to the next house is a choice.',
    author: 'Stephen R. Covey',
    source: 'The 7 Habits of Highly Effective People',
    topics: ['mindset', 'rejection', 'resilience'],
  },
  {
    id: 'covey-2',
    kind: 'idea',
    text: 'Begin with the end in mind. Decide what you are actually aiming at before you get efficient at moving, or you will get very good at climbing a ladder leaning against the wrong wall.',
    author: 'Stephen R. Covey',
    source: 'The 7 Habits of Highly Effective People',
    topics: ['purpose', 'mindset'],
  },
  {
    id: 'covey-3',
    kind: 'idea',
    text: 'Put first things first. Most people spend their day on what is urgent; almost everything that changes a career is important and never urgent. Practising your pitch is never urgent.',
    author: 'Stephen R. Covey',
    source: 'The 7 Habits of Highly Effective People',
    topics: ['discipline', 'habits'],
  },
  {
    id: 'covey-4',
    kind: 'idea',
    text: 'Seek first to understand, then to be understood. Most reps listen only long enough to find the gap where their rebuttal fits. That is not listening, and the customer can tell.',
    author: 'Stephen R. Covey',
    source: 'The 7 Habits of Highly Effective People',
    topics: ['sales', 'leadership'],
  },
  {
    id: 'covey-5',
    kind: 'idea',
    text: 'Sharpen the saw. The output of a week is set partly by what you did to stay sharp in it — sleep, training, reps on the script. Cutting those to knock more doors is sawing with a blunter blade for longer.',
    author: 'Stephen R. Covey',
    source: 'The 7 Habits of Highly Effective People',
    topics: ['habits', 'consistency', 'discipline'],
  },

  // --- Viktor E. Frankl ---
  {
    id: 'frankl-1',
    kind: 'idea',
    text: 'A person who has a reason to endure something can endure almost any version of it. Suffering without meaning breaks people; the same suffering attached to a why is survivable. Frankl worked this out somewhere considerably worse than a bad territory.',
    author: 'Viktor E. Frankl',
    source: "Man's Search for Meaning",
    topics: ['purpose', 'resilience', 'mindset'],
  },
  {
    id: 'frankl-2',
    kind: 'idea',
    text: 'Meaning is not something you receive, it is something you are responsible to. Asking what you want from the year is a weaker question than asking what the year is asking of you.',
    author: 'Viktor E. Frankl',
    source: "Man's Search for Meaning",
    topics: ['purpose', 'mindset'],
  },

  // --- Simon Sinek ---
  {
    id: 'sinek-1',
    kind: 'idea',
    text: 'People do not commit to what you do, they commit to why you do it. That is true of customers, and it is far more true of yourself at 6pm on a Thursday.',
    author: 'Simon Sinek',
    source: 'Start With Why',
    topics: ['purpose', 'sales'],
  },

  // --- Ryan Holiday ---
  {
    id: 'holiday-1',
    kind: 'idea',
    text: 'The obstacle is the way. The thing blocking you is usually also the thing that will teach you the most, and the reason most competitors quit — which is precisely why getting through it is worth so much.',
    author: 'Ryan Holiday',
    source: 'The Obstacle Is the Way',
    topics: ['resilience', 'mindset', 'fear'],
  },
  {
    id: 'holiday-2',
    kind: 'idea',
    text: 'Ego is the enemy. The rep who cannot be coached because they already know is the rep who plateaus in month four and blames the territory.',
    author: 'Ryan Holiday',
    source: 'Ego Is the Enemy',
    topics: ['mindset', 'leadership'],
  },

  // --- Daniel H. Pink ---
  {
    id: 'pink-1',
    kind: 'idea',
    text: 'Autonomy, mastery and purpose outlast bonuses and leaderboards. External incentives work in bursts and stop the moment nobody is watching — and most of this job happens when nobody is watching.',
    author: 'Daniel H. Pink',
    source: 'Drive',
    topics: ['purpose', 'consistency', 'money'],
  },
  {
    id: 'pink-2',
    kind: 'idea',
    text: 'Selling now is less about persuading and more about serving — finding the problem the person did not know how to name, then being useful about it.',
    author: 'Daniel H. Pink',
    source: 'To Sell Is Human',
    topics: ['sales'],
  },

  // --- Angela Duckworth ---
  {
    id: 'duckworth-2',
    kind: 'idea',
    text: 'Grit is passion and perseverance pointed at the same thing for an unreasonable length of time. The perseverance half is downstream of the passion half — nobody grinds for years at something they do not care about.',
    author: 'Angela Duckworth',
    source: 'Grit',
    topics: ['purpose', 'consistency', 'discipline'],
  },

  // --- Kelly McGonigal ---
  {
    id: 'mcgonigal-1',
    kind: 'idea',
    text: 'How you read stress changes what it does to you. The same racing heart is either a body falling apart or a body getting ready, and which one it becomes depends partly on which one you call it.',
    author: 'Kelly McGonigal',
    source: 'The Upside of Stress',
    topics: ['fear', 'resilience', 'mindset'],
  },

  // --- Dale Carnegie ---
  {
    id: 'carnegie-1',
    kind: 'idea',
    text: "A person's own name is the sweetest sound in any language, and genuine interest in someone beats any amount of trying to be interesting. Most doorstep rapport fails because the rep is performing rather than curious.",
    author: 'Dale Carnegie',
    source: 'How to Win Friends and Influence People',
    topics: ['sales', 'leadership'],
  },
  {
    id: 'carnegie-2',
    kind: 'idea',
    text: 'You cannot win an argument. Even when you are right, proving a customer wrong costs you the sale — they will concede the point and buy from someone else.',
    author: 'Dale Carnegie',
    source: 'How to Win Friends and Influence People',
    topics: ['sales', 'rejection'],
  },

  // --- Seth Godin ---
  {
    id: 'godin-1',
    kind: 'idea',
    text: 'The resistance is loudest right before work that matters. Feeling reluctant at a particular door is information about the door, not a reason to skip it.',
    author: 'Seth Godin',
    source: 'The Practice',
    topics: ['fear', 'discipline', 'consistency'],
  },

  // --- Carol Dweck ---
  {
    id: 'dweck-2',
    kind: 'idea',
    text: 'Praise the process, not the person. A rep told they are naturally gifted gets fragile the first bad week; a rep told their preparation showed goes and prepares again.',
    author: 'Carol Dweck',
    source: 'Mindset',
    topics: ['mindset', 'leadership', 'resilience'],
  },

  // --- James Clear ---
  {
    id: 'clear-3',
    kind: 'idea',
    text: 'You do not rise to the level of your goals, you fall to the level of your systems. Wanting twenty sales this month changes nothing; changing what happens at 8:30 every morning changes everything.',
    author: 'James Clear',
    source: 'Atomic Habits',
    topics: ['habits', 'consistency', 'discipline'],
  },
  {
    id: 'clear-4',
    kind: 'idea',
    text: 'Every action is a vote for the person you are becoming. One knock is not a career, but it is a ballot.',
    author: 'James Clear',
    source: 'Atomic Habits',
    topics: ['habits', 'consistency', 'purpose'],
  },
];

export function entriesForTopic(topic: TopicId): LockInEntry[] {
  return LOCK_IN_ENTRIES.filter((e) => e.topics.includes(topic));
}

/** Case-insensitive search across text, author, source and topic label. */
export function searchEntries(query: string): LockInEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return LOCK_IN_ENTRIES;
  const matchingTopics = TOPICS.filter((t) => t.label.toLowerCase().includes(q)).map((t) => t.id);
  return LOCK_IN_ENTRIES.filter(
    (e) =>
      e.text.toLowerCase().includes(q) ||
      e.author.toLowerCase().includes(q) ||
      (e.source ?? '').toLowerCase().includes(q) ||
      e.topics.some((t) => matchingTopics.includes(t))
  );
}

export const AUTHORS = Array.from(new Set(LOCK_IN_ENTRIES.map((e) => e.author))).sort();

export interface Shelf {
  source: string;
  author: string;
  count: number;
}

/**
 * The library browsable by where it came from rather than by topic — closer to how people
 * actually look for something they half-remember reading. Entries with no established
 * source (loose attributions floating around the internet) are deliberately left off the
 * shelf rather than filed under a book we are guessing at.
 */
export function shelves(): Shelf[] {
  const counts = new Map<string, Shelf>();
  for (const e of LOCK_IN_ENTRIES) {
    if (!e.source) continue;
    const existing = counts.get(e.source);
    if (existing) existing.count += 1;
    else counts.set(e.source, { source: e.source, author: e.author, count: 1 });
  }
  return [...counts.values()].sort((a, b) => a.source.localeCompare(b.source));
}

export function entriesForSource(source: string): LockInEntry[] {
  return LOCK_IN_ENTRIES.filter((e) => e.source === source);
}
