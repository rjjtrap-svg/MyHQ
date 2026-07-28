/**
 * Starting-draft door-to-door fiber internet sales script and objection-handling guide.
 * Shown on the Coach tab's Training page, and mirrored (see functions/fiberScript.js) as the
 * grading rubric / context the AI coach uses. Edit both files together if you change this —
 * they're kept in sync manually since the Cloud Function can't import from src/.
 */

export interface ScriptSection {
  title: string;
  lines: string[];
}

export interface ObjectionEntry {
  objection: string;
  response: string;
}

export const PITCH_SCRIPT: ScriptSection[] = [
  {
    title: '1. The Approach (first 10 seconds)',
    lines: [
      'Smile, make eye contact, step back half a step so you\'re not looming in the doorway.',
      '"Hey, how\'s it going? I\'m [name] with [company] — we\'re out here today because we just finished lighting up fiber internet on this street."',
      'Point down the street if you can. Specificity ("this street," "your neighbor at #24") builds instant credibility.',
    ],
  },
  {
    title: '2. Discovery (find the real need)',
    lines: [
      '"Real quick — who do you have for internet right now, [provider]?"',
      '"How\'s it been treating you — any buffering, drops during video calls, slow spots in the house?"',
      'Listen for the actual pain: price, speed, reliability, or bad past experience with a provider. Whatever they say first is what you sell to.',
    ],
  },
  {
    title: '3. The Pitch (tie fiber to their pain)',
    lines: [
      'Mirror their words back: if they said "it\'s expensive," lead with price. If they said "it drops during calls," lead with reliability.',
      '"So the difference with fiber is [X] — that\'s the actual glass line running to your house instead of the old copper, so [benefit tied to their pain]."',
      'Keep it to 2-3 sentences. Nobody needs a technical seminar on their porch.',
    ],
  },
  {
    title: '4. The Close',
    lines: [
      'Assume the sale, don\'t ask permission: "Let\'s go ahead and get you switched over — I just need two minutes to pull up what\'s available at your address."',
      'If they hesitate, go back to discovery — you moved to close too early on an unaddressed objection.',
      'Always leave with a specific next step and your name/number written down, even on a no.',
    ],
  },
];

export const OBJECTIONS: ObjectionEntry[] = [
  {
    objection: "I already have internet / I'm happy with what I have.",
    response:
      "\"Totally get it — most people we talk to already have something. Quick question though: how's the speed when everyone's on it at once, phones, TV, laptop?\" Redirect to a pain point before pitching anything.",
  },
  {
    objection: "I'm under contract with my current provider.",
    response:
      "\"That's actually really common, and it's not a dealbreaker — we can get you switched over now and timed so it lines up with when your contract's up, so you're never paying double. Want me to check what that date looks like?\"",
  },
  {
    objection: 'How much does it cost?',
    response:
      "Give a real number, don't dodge it. Then immediately compare to what they're paying now: \"It's $[X]/month — how does that compare to what you're paying [current provider] right now?\" Price objections are almost always about value, not the number itself.",
  },
  {
    objection: "I need to talk to my spouse/roommate first.",
    response:
      "\"Makes sense, it's a household decision. Is there anything about what I just went over that you're not sure about, so I can make sure I explain it right when you two talk?\" Then: \"Would it help if I came back tonight when they're home, or is there a good number to reach them at?\" Never let it end as a dead end.",
  },
  {
    objection: "I've had bad experiences with door-to-door sales / this feels like a scam.",
    response:
      "Don't get defensive. \"Totally fair — there's a lot of that out there. I've got a company badge here [show it], and everything I'm telling you, you can verify by calling the number on our site directly, not through me.\" Offer to let them look you up before you continue.",
  },
  {
    objection: "I'm renting, not the homeowner.",
    response:
      "\"No problem at all — a lot of our customers rent. We just need your info for the account, and installation doesn't require any permanent changes the landlord would need to approve.\" (Confirm your company's actual renter policy and swap this in.)",
  },
  {
    objection: "I don't have time right now.",
    response:
      "\"Totally understand, I'll be quick — genuinely 90 seconds.\" If they still say no: \"No worries — what's a better time today or tomorrow? I can swing back.\" Get a concrete window, not a vague \"maybe later.\"",
  },
  {
    objection: 'Just leave me a flyer / send me some info.',
    response:
      "\"I can definitely leave you something — but honestly the pricing depends on your exact address, so a generic flyer won't have your real numbers. Give me 60 seconds to check your address and I'll write your actual price on it before I go.\"",
  },
];

export const CLOSING_TIPS: string[] = [
  "Every conversation ends with a next step, even a 'no' — a callback time, a flyer with your number, or a follow-up date.",
  'Log the deal (with a photo) the moment it closes — don\'t wait until end of day, details get fuzzy.',
  "If you get 3 doors in a row with the same objection, that's a sign to adjust your opener, not a coincidence.",
];
