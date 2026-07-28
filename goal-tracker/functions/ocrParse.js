'use strict';

/**
 * Pulling customer fields out of an OCR'd order screen.
 *
 * Split out of index.js so it can be tested without standing up Cloud Functions or Vision.
 * This is heuristic text matching over noisy input — the only way to get it right is to run
 * it against realistic line dumps, and that needs a plain function.
 *
 * Two things sank the previous version:
 *
 *  1. Only the first 20 OCR lines were considered. On a real CRM confirmation screen the
 *     customer block sits well below 20 lines of header, nav and plan chrome, so the label
 *     matcher never saw the fields it was looking for.
 *  2. An inline match required a ':' or '-' separator. Vision frequently drops the colon,
 *     yielding "Customer Name Jordan Smith" on one line, which matched nothing.
 */

const MAX_FIELD_LENGTH = 80;
/** How far below a bare label to look for its value. Two-column layouts often wrap. */
const LOOKAHEAD_LINES = 3;

const STREET_SUFFIXES =
  'street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|circle|cir|' +
  'place|pl|parkway|pkwy|highway|hwy|trail|trl|terrace|ter|square|sq|loop|crossing|xing|' +
  'run|bend|ridge|pass|point|pt|cove|walk|row|path|park|plaza|manor|mews|close';

const ADDRESS_RE = new RegExp(`^\\d+\\s+[\\w\\s.,'#-]*\\b(${STREET_SUFFIXES})\\b\\.?`, 'i');
const NAME_RE = /^[A-Z][a-zA-Z'’-]+(?:\s+[A-Z][a-zA-Z'’-]+){1,2}$/;

/**
 * Words that appear on paperwork and look like names to a regex. Kept as its own list
 * because a false positive here silently fills the customer name with "Total Due".
 */
const NAME_BLACKLIST =
  /\b(invoice|contract|estimate|customer|bill\s*to|ship\s*to|date|total|signature|address|phone|email|order|receipt|company|account|balance|amount|due|paid|quote|proposal|summary|confirmation|plan|package|internet|fiber|gig|speed|monthly|install|technician|appointment|status|pending|active|service|agent|rep|sales)\b/i;

/**
 * Labels, longest-first inside each group so "customer name" wins over "name" and we don't
 * capture "Name" out of "Customer Name" leaving the value mangled.
 */
const LABELS = {
  name: [
    'customer name', 'account name', 'subscriber name', 'full name', 'client name',
    'primary contact', 'account holder', 'customer', 'name',
  ],
  firstName: ['first name', 'given name', 'first'],
  lastName: ['last name', 'surname', 'family name', 'last'],
  address: [
    'service address', 'installation address', 'install address', 'property address',
    'street address', 'mailing address', 'service location', 'address', 'located at',
  ],
  phone: [
    'mobile number', 'phone number', 'contact number', 'cell phone', 'mobile', 'phone',
    'cell', 'tel', 'contact',
  ],
};

function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Is this line itself a label? Used so lookahead doesn't grab the next field's label. */
function isAnyLabel(line) {
  const all = Object.values(LABELS).flat().map(escape).join('|');
  return new RegExp(`^\\s*(?:${all})\\s*[:\\-]?\\s*$`, 'i').test(line);
}

function cleanValue(raw) {
  if (!raw) return undefined;
  const value = raw.replace(/\s+/g, ' ').replace(/^[:\-–—\s]+/, '').trim();
  if (!value || value.length > MAX_FIELD_LENGTH) return undefined;
  return value;
}

/**
 * Finds the value for one field.
 *
 * Strategies run in confidence order: an explicit "Label: value" beats a separator-less
 * "Label value", which beats a value found on a following line. Taking the first strategy
 * that yields a valid value keeps a confident match from being overridden by a sloppier one
 * further down the page.
 */
function extractLabeled(lines, labels, validate) {
  const alternation = labels.map(escape).join('|');
  const withSeparator = new RegExp(`^\\s*(?:${alternation})\\s*[:\\-–—]\\s*(.+)$`, 'i');
  // No separator: require at least two characters of value so "Name" alone doesn't match.
  const withoutSeparator = new RegExp(`^\\s*(?:${alternation})\\s+(\\S.*)$`, 'i');
  const labelOnly = new RegExp(`^\\s*(?:${alternation})\\s*[:\\-–—]?\\s*$`, 'i');

  for (const re of [withSeparator, withoutSeparator]) {
    for (const line of lines) {
      const value = cleanValue(line.match(re)?.[1]);
      // A captured value that is itself a label means the alternation backtracked into a
      // shorter label: on "Customer Name" the `customer` alternative matches and captures
      // "Name" as the value. Without this guard the parser confidently reports a customer
      // called "Name".
      if (value && !isAnyLabel(value) && (!validate || validate(value))) return value;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    if (!labelOnly.test(lines[i])) continue;
    for (let j = i + 1; j <= i + LOOKAHEAD_LINES && j < lines.length; j++) {
      const candidate = lines[j];
      if (!candidate || isAnyLabel(candidate)) break;
      const value = cleanValue(candidate);
      if (value && (!validate || validate(value))) return value;
    }
  }

  return undefined;
}

/** Ten or eleven digits, however the screen chose to punctuate them. */
function normalisePhone(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits.length === 10 ? digits : undefined;
}

function formatPhone(digits) {
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * @param {string[]} lines OCR text lines, in document order.
 * @returns {{name?:string, firstName?:string, lastName?:string, address?:string, phone?:string}}
 */
function parseDealFields(lines) {
  const clean = (lines || []).map((l) => String(l).trim()).filter((l) => l.length > 0);

  const looksLikeName = (v) => !NAME_BLACKLIST.test(v) && /[a-zA-Z]/.test(v) && !ADDRESS_RE.test(v);
  const looksLikeAddress = (v) => /\d/.test(v) && v.length >= 5;

  let name = extractLabeled(clean, LABELS.name, looksLikeName);
  const firstName = extractLabeled(clean, LABELS.firstName, looksLikeName);
  const lastName = extractLabeled(clean, LABELS.lastName, looksLikeName);
  let address = extractLabeled(clean, LABELS.address, looksLikeAddress);

  const phoneRaw = extractLabeled(clean, LABELS.phone, (v) => !!normalisePhone(v));
  let phone = phoneRaw ? normalisePhone(phoneRaw) : undefined;

  // Unlabelled fallbacks, for paperwork that just prints the details (an ID, a hand-written
  // sheet). Deliberately last: a labelled match is always more trustworthy than a shape
  // that happens to look right somewhere on the page.
  if (!name && !(firstName && lastName)) {
    name = clean.find((l) => NAME_RE.test(l) && looksLikeName(l));
  }
  if (!address) {
    address = clean.find((l) => ADDRESS_RE.test(l));
  }
  if (!phone) {
    const candidate = clean.map(normalisePhone).find(Boolean);
    if (candidate) phone = candidate;
  }

  // Split a combined name so the deal's first/last fields can be filled too, and compose
  // one when only the parts were labelled.
  let first = firstName;
  let last = lastName;
  if (!first && !last && name) {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      first = parts[0];
      last = parts.slice(1).join(' ');
    }
  }
  if (!name && first && last) name = `${first} ${last}`;

  return {
    ...(name ? { name } : {}),
    ...(first ? { firstName: first } : {}),
    ...(last ? { lastName: last } : {}),
    ...(address ? { address } : {}),
    ...(phone ? { phone: formatPhone(phone) } : {}),
  };
}

module.exports = { parseDealFields };
