/**
 * Free first-fix templates — one giveaway per top leak category × industry.
 * Copy is intentionally concrete so the call becomes “what are the other six?”
 */

/** @typedef {{ industry: string, leakCategory: string, title: string, intro: string, messages: Array<{label: string, channel: string, body: string}>, closing: string }} FreeFix */

/** @type {FreeFix[]} */
export const FREE_FIXES = [
  // ---- Lost leads / cold follow-up ----
  {
    industry: 'recruitment',
    leakCategory: 'lost-leads',
    title: '3-touch cold candidate chase',
    intro:
      'Your #1 leak is cold / unworked leads. Here’s the exact 3-message sequence that re-opens stuck candidates — free.',
    messages: [
      {
        label: 'Touch 1 — Same day',
        channel: 'SMS / WhatsApp',
        body: 'Hi {{firstName}} — just saw your application for {{role}}. Are you still open to a quick chat this week, or has something else landed?',
      },
      {
        label: 'Touch 2 — Day 3',
        channel: 'Email',
        body: 'Subject: Still worth a look?\n\n{{firstName}}, I don’t want to chase you if the timing is off. If {{role}} (or something close) is still live, reply “Y” and I’ll send times. If not, one word is enough — “pass”.',
      },
      {
        label: 'Touch 3 — Day 7',
        channel: 'SMS / Email',
        body: 'Last nudge from me on {{role}}. If you want me to keep you in mind for similar desks, reply “keep me”. Otherwise I’ll close the loop so we’re not both chasing ghosts.',
      },
    ],
    closing: 'That’s fix number one. The other six automations in your report are what a call is for.',
  },
  {
    industry: 'solar',
    leakCategory: 'lost-leads',
    title: '3-touch abandoned quote recovery',
    intro:
      'Your #1 leak is cold / unworked leads. Here’s the exact 3-message follow-up that resurrects stalled quotes — free.',
    messages: [
      {
        label: 'Touch 1 — 24 hours after quote',
        channel: 'SMS',
        body: 'Hi {{firstName}} — {{advisor}} here from {{company}}. Your solar quote for {{address}} is ready. Any questions on the numbers, or shall we lock a survey slot?',
      },
      {
        label: 'Touch 2 — Day 4',
        channel: 'Email',
        body: 'Subject: Your quote + one question\n\n{{firstName}}, most homeowners stall on one of three things: roof complexity, grant paperwork, or cashflow timing. Which one is yours? Reply with 1, 2 or 3 and I’ll cut that friction for you.',
      },
      {
        label: 'Touch 3 — Day 10',
        channel: 'SMS / WhatsApp',
        body: 'Last check-in on the {{systemSize}}kW quote. Prices and grant windows move. Want me to hold the proposal open another week, or close the file?',
      },
    ],
    closing: 'That’s fix number one. The other six are what a call is for.',
  },
  {
    industry: 'marketing',
    leakCategory: 'lost-leads',
    title: '3-touch proposal chase',
    intro:
      'Your #1 leak is cold / unworked leads. Here’s the exact 3-message sequence that restarts stuck proposals — free.',
    messages: [
      {
        label: 'Touch 1 — 48 hours after send',
        channel: 'Email',
        body: 'Subject: Quick check on the {{service}} proposal\n\n{{firstName}} — flagged this so it doesn’t die in the inbox. Is the scope clear, or is there one section you’d change before we talk timelines?',
      },
      {
        label: 'Touch 2 — Day 5',
        channel: 'LinkedIn / Email',
        body: 'Still useful: I’ve got capacity to start {{month}} if we lock this week. If budget or timing moved, tell me straight — happy to reshape rather than ghost the thread.',
      },
      {
        label: 'Touch 3 — Day 12',
        channel: 'Email',
        body: 'Subject: Closing the loop\n\nI’ll archive the {{service}} proposal Friday unless you’d like it kept open. No hard feelings either way — prefer a clean no to a silent maybe.',
      },
    ],
    closing: 'That’s fix number one. The other six are what a call is for.',
  },
  {
    industry: 'general',
    leakCategory: 'lost-leads',
    title: '3-touch cold lead follow-up',
    intro:
      'Your #1 leak is cold / unworked leads. Here’s the exact 3-message follow-up sequence that fixes it — free.',
    messages: [
      {
        label: 'Touch 1 — Within 1 hour',
        channel: 'SMS or email',
        body: 'Hi {{firstName}} — thanks for reaching out. I’ve got two slots this week for a quick call. Prefer Tue or Thu?',
      },
      {
        label: 'Touch 2 — Day 3',
        channel: 'Email',
        body: 'Subject: Still the right time?\n\n{{firstName}}, checking in on your enquiry about {{offer}}. If the timing shifted, reply “later” and I’ll park it. If you’re ready, pick a time: {{bookingLink}}',
      },
      {
        label: 'Touch 3 — Day 8',
        channel: 'SMS / Email',
        body: 'Last note from me so I don’t become noise. Want me to leave the door open on {{offer}}, or close the file?',
      },
    ],
    closing: 'That’s fix number one. The other six are what a call is for.',
  },

  // ---- Slow response ----
  {
    industry: 'recruitment',
    leakCategory: 'response',
    title: 'Missed-call recovery script',
    intro:
      'Your #1 leak is slow response. Here’s a same-hour recovery sequence you can fire the moment a call is missed — free.',
    messages: [
      {
        label: 'Instant SMS (auto)',
        channel: 'SMS',
        body: 'Hi {{firstName}}, sorry I just missed you — I’m with a candidate. Text me preferred time today or tomorrow and I’ll call you back within the hour.',
      },
      {
        label: '15-min email backup',
        channel: 'Email',
        body: 'Subject: Just missed your call\n\n{{firstName}} — saw the missed call. If this is about {{roleOrClient}}, reply with a window and I’ll prioritise. If urgent, WhatsApp me on {{number}}.',
      },
      {
        label: 'End-of-day chase',
        channel: 'SMS',
        body: 'Still trying to connect on earlier call. Two slots left tomorrow: {{slot1}} or {{slot2}}. Reply 1 or 2.',
      },
    ],
    closing: 'That’s fix number one. Speed-to-lead systems are how this runs without you babysitting the phone.',
  },
  {
    industry: 'solar',
    leakCategory: 'response',
    title: 'Speed-to-lead auto-reply pack',
    intro:
      'Your #1 leak is slow response. Here’s a first-hour capture pack that stops paid/franchise leads going cold — free.',
    messages: [
      {
        label: 'Instant web form reply',
        channel: 'SMS + Email',
        body: 'Thanks {{firstName}} — we got your solar enquiry for {{postcode}}. A survey coordinator will call within 2 hours (business hours). Meanwhile, roof age + annual bill helps us prep: reply here.',
      },
      {
        label: 'If no connect in 2h',
        channel: 'SMS',
        body: '{{firstName}} — tried you. Prefer a call at {{slot1}} or {{slot2}}? Reply 1 or 2 and we’ll lock it.',
      },
      {
        label: 'Evening safety net',
        channel: 'Email',
        body: 'Subject: We tried to reach you\n\nYou enquired about solar earlier. Book any remaining slot here: {{bookingLink}}. Quotes go stale when roof photos and bill data arrive late — this keeps yours hot.',
      },
    ],
    closing: 'That’s fix number one. The rest of the speed stack is what we map on a call.',
  },
  {
    industry: 'marketing',
    leakCategory: 'response',
    title: 'Inbound lead SLA pack',
    intro:
      'Your #1 leak is slow response. Here’s a same-day SLA pack that makes every inbound feel handled — free.',
    messages: [
      {
        label: 'Instant ack',
        channel: 'Email',
        body: 'Subject: Got it — next step\n\n{{firstName}}, thanks for the note on {{service}}. I’ve put you with {{owner}}. Expect a reply within 4 business hours with either times or a clarifying question.',
      },
      {
        label: 'If owner silent at 3h',
        channel: 'Slack / internal + client SMS',
        body: 'Client-facing: “Still on it — {{owner}} is finishing a deliverable and will send times before EOD.” Internal: escalate to backup owner.',
      },
      {
        label: 'Close-of-day recover',
        channel: 'Email',
        body: 'Subject: Two times tomorrow\n\n{{firstName}} — offered {{slot1}} or {{slot2}}. If neither works, send three windows and we’ll match.',
      },
    ],
    closing: 'That’s fix number one. The other six plug the rest of the revenue path.',
  },
  {
    industry: 'general',
    leakCategory: 'response',
    title: 'Speed-to-lead recovery pack',
    intro:
      'Your #1 leak is slow response. Here’s a same-hour recovery sequence — free.',
    messages: [
      {
        label: 'Instant miss',
        channel: 'SMS',
        body: 'Hi {{firstName}}, just missed you. Text a good time and I’ll call back within the hour.',
      },
      {
        label: '60-minute email',
        channel: 'Email',
        body: 'Subject: Following up on your enquiry\n\n{{firstName}} — happy to help with {{offer}}. Book here {{bookingLink}} or reply with two times that work.',
      },
      {
        label: 'Same-day close',
        channel: 'SMS',
        body: 'Last try today — want me to hold a slot tomorrow morning or afternoon?',
      },
    ],
    closing: 'That’s fix number one. The other six are what a call is for.',
  },

  // ---- Follow-up leakage ----
  {
    industry: 'recruitment',
    leakCategory: 'followup',
    title: 'Client update cadence',
    intro:
      'Your #1 leak is follow-up leakage. Here’s a lightweight client-update cadence that stops “any news?” chasing — free.',
    messages: [
      {
        label: 'Day 0 after shortlist',
        channel: 'Email',
        body: 'Subject: Shortlist + next checkpoints\n\n{{client}}, sending the {{role}} shortlist. You’ll get a progress pulse every 72h until first interviews are booked — even if the update is “still sourcing”.',
      },
      {
        label: '72h pulse',
        channel: 'Email / WhatsApp',
        body: 'Quick pulse on {{role}}: {{n}} candidates in play, {{n2}} interviews requested, blockers: {{blockerOrNone}}. Need anything from your side?',
      },
      {
        label: 'Stalled interview nudge',
        channel: 'Email',
        body: 'Two strong candidates go cold after 5 quiet days. Can we lock feedback on {{name}} by {{date}} so I can protect the process?',
      },
    ],
    closing: 'That’s fix number one. Systemising the rest of the desk is the call.',
  },
  {
    industry: 'solar',
    leakCategory: 'followup',
    title: 'Quote chase ladder',
    intro:
      'Your #1 leak is follow-up leakage. Here’s a quote chase ladder your team can paste into any CRM — free.',
    messages: [
      {
        label: 'Day 2',
        channel: 'SMS',
        body: 'Hi {{firstName}} — any questions after looking at the solar quote? Happy to walk the bill savings line-by-line for 10 mins.',
      },
      {
        label: 'Day 6',
        channel: 'Email',
        body: 'Subject: Grant timing vs install slot\n\n{{firstName}}, install calendar is filling for {{month}}. If we start paperwork this week, we protect your preferred window. Reply YES for a 15-min grant walkthrough.',
      },
      {
        label: 'Day 14',
        channel: 'SMS',
        body: 'Closing loop on the quote unless you want it extended. Reply HOLD or CLOSE.',
      },
    ],
    closing: 'That’s fix number one. The other six tighten survey → install.',
  },
  {
    industry: 'marketing',
    leakCategory: 'followup',
    title: 'Nurture without the newsletter graveyard',
    intro:
      'Your #1 leak is follow-up leakage. Here’s a 3-touch nurture that doesn’t feel like a spam list — free.',
    messages: [
      {
        label: 'Touch 1',
        channel: 'Email',
        body: 'Subject: The metric we fix first\n\n{{firstName}} — most {{industry}} teams that talk to us are leaking on {{pain}}. Here’s the 1-page teardown we use on discovery calls [link]. No pitch hangover.',
      },
      {
        label: 'Touch 2',
        channel: 'Email',
        body: 'Subject: 12-minute teardown\n\nIf useful, I can show how {{pain}} shows up in your funnel with a screen-share — 12 mins, calendar here: {{bookingLink}}',
      },
      {
        label: 'Touch 3',
        channel: 'Email',
        body: 'Subject: Parking this\n\nI’ll stop the sequence so I’m not noise. If {{quarter}} opens up, reply “later” and I’ll check in then.',
      },
    ],
    closing: 'That’s fix number one. Sequencing the full lifecycle is the call.',
  },
  {
    industry: 'general',
    leakCategory: 'followup',
    title: 'Simple multi-touch ladder',
    intro:
      'Your #1 leak is follow-up leakage. Here’s a 3-touch ladder anyone on the team can run — free.',
    messages: [
      {
        label: 'Day 1',
        channel: 'SMS / Email',
        body: 'Hi {{firstName}} — following up on {{topic}}. Useful to continue, or bad timing?',
      },
      {
        label: 'Day 4',
        channel: 'Email',
        body: 'Subject: One question\n\nWhat’s the one thing that would make {{offer}} an easy yes or an easy no?',
      },
      {
        label: 'Day 10',
        channel: 'SMS',
        body: 'Closing the loop unless you want a reminder next month. Reply YES / NO / NEXT MONTH.',
      },
    ],
    closing: 'That’s fix number one. The other six are what a call is for.',
  },

  // ---- Referrals ----
  {
    industry: 'recruitment',
    leakCategory: 'referrals',
    title: 'Post-placement referral ask',
    intro:
      'Your #1 leak is the missing referral channel. Here’s a placement-day referral sequence — free.',
    messages: [
      {
        label: 'Day 7 after start',
        channel: 'Email / SMS',
        body: 'Hi {{firstName}} — week one in. Glad it’s landing. Who else in your network is quietly open to a move this quarter? Happy to be discreet.',
      },
      {
        label: 'Day 30',
        channel: 'Email',
        body: 'Subject: One introduction?\n\nIf onboarding still feels good, a single intro to a peer who’d value the same process is the highest-leverage thank-you we can ask for.',
      },
      {
        label: 'Client side day 14',
        channel: 'Email',
        body: '{{hiringManager}} — how is {{candidate}} settling? If the fill felt smooth, which other desks are thrashing right now?',
      },
    ],
    closing: 'That’s fix number one. Building it into every placement is the system.',
  },
  {
    industry: 'solar',
    leakCategory: 'referrals',
    title: 'Neighbour referral pack',
    intro:
      'Your #1 leak is the missing referral channel. Here’s a post-install neighbour pack — free.',
    messages: [
      {
        label: 'Install day +2',
        channel: 'SMS',
        body: 'Hi {{firstName}} — system live. If a neighbour asks what you paid / saved, send them this link and we’ll treat them as a VIP referral: {{referralLink}}',
      },
      {
        label: 'Day 14 review + refer',
        channel: 'Email',
        body: 'Subject: 30-second review + neighbour perk\n\nIf you’re happy, a Google review helps more homeowners trust the process. And every successful neighbour install credits you {{incentive}}.',
      },
      {
        label: 'Day 45 production share',
        channel: 'SMS',
        body: 'Your system produced ~{{kwh}} so far. Know a neighbour with a similar roof? Forward this and we’ll honour the referral rate.',
      },
    ],
    closing: 'That’s fix number one. Automating the channel is the rest of the build.',
  },
  {
    industry: 'marketing',
    leakCategory: 'referrals',
    title: 'Client intro ask',
    intro:
      'Your #1 leak is the missing referral channel. Here’s a retainer-friendly intro ask — free.',
    messages: [
      {
        label: 'After a win',
        channel: 'Email',
        body: 'Subject: Small ask after the {{win}}\n\n{{firstName}} — stoked on {{result}}. If a peer founder is fighting the same growth leak, open to a warm intro? I’ll keep it founder-to-founder, no hard sell.',
      },
      {
        label: 'QBR closer',
        channel: 'Meeting + email follow',
        body: 'In the room: “Who else should be getting numbers like these?” After: send a 3-bullet blurb they can forward verbatim.',
      },
      {
        label: 'Partner reciprocal',
        channel: 'Email',
        body: 'We send qualified {{adjacentService}} intros your way when we see the fit — want a monthly swap list?',
      },
    ],
    closing: 'That’s fix number one. Systemising testimonials → intros is the call.',
  },
  {
    industry: 'general',
    leakCategory: 'referrals',
    title: 'Simple referral ask',
    intro:
      'Your #1 leak is the missing referral channel. Here’s a clean 3-step ask — free.',
    messages: [
      {
        label: 'After delivery win',
        channel: 'Email / SMS',
        body: 'Glad {{result}} landed. Who else should hear how we did it? One name is enough.',
      },
      {
        label: 'Make it easy',
        channel: 'Email',
        body: 'Here’s a 3-line blurb you can forward: “{{blurb}}”. Or I can intro-email them directly if you prefer.',
      },
      {
        label: 'Thank + close',
        channel: 'SMS',
        body: 'Thanks for the intro to {{name}} — I’ll keep you posted and stay respectful of your relationship.',
      },
    ],
    closing: 'That’s fix number one. The other six are what a call is for.',
  },

  // ---- Admin ----
  {
    industry: 'recruitment',
    leakCategory: 'admin',
    title: 'Interview logistics checklist',
    intro:
      'Your #1 leak is repetitive admin labour. Here’s a bare-minimum interview logistics checklist that deletes back-and-forth — free.',
    messages: [
      {
        label: 'On interview booked',
        channel: 'Email (auto)',
        body: 'Hi {{candidate}} — confirmed {{datetime}} with {{client}} via {{videoOrSite}}. Join link: {{link}}. Reschedule: {{rescheduleLink}}. Reply CONFIRM.',
      },
      {
        label: 'T-24h',
        channel: 'SMS',
        body: 'Reminder: interview tomorrow {{time}} with {{client}}. Still good? Reply YES / NEED MOVE.',
      },
      {
        label: 'T+2h feedback ask',
        channel: 'Email to client',
        body: 'Feedback on {{candidate}}? One-liner is enough: Strong yes / Maybe / No + reason. Stops the chase cycle.',
      },
    ],
    closing: 'That’s fix number one. Wiring the desk so this runs itself is the call.',
  },
  {
    industry: 'solar',
    leakCategory: 'admin',
    title: 'Paperwork chase mini-runbook',
    intro:
      'Your #1 leak is repetitive admin labour. Here’s a grant/paperwork chase mini-runbook — free.',
    messages: [
      {
        label: 'Docs request',
        channel: 'Email + SMS',
        body: 'To lock your install we still need: (1) bill photo (2) MPRN / meter (3) roof photos. Upload here: {{link}}. Most people finish in 6 minutes.',
      },
      {
        label: 'Day 3 missing docs',
        channel: 'SMS',
        body: 'Still missing {{missingItem}}. Want a 5-min call to capture it together?',
      },
      {
        label: 'Internal SLA',
        channel: 'Ops note',
        body: 'If docs incomplete >5 days, auto-pause quote validity and notify owner — stops zombie deals clogging the board.',
      },
    ],
    closing: 'That’s fix number one. Full grant automation is a build conversation.',
  },
  {
    industry: 'marketing',
    leakCategory: 'admin',
    title: 'Reporting day runbook',
    intro:
      'Your #1 leak is repetitive admin labour. Here’s a reporting-day runbook that stops Sunday-night heroics — free.',
    messages: [
      {
        label: 'T-2 days',
        channel: 'Internal checklist',
        body: 'Pull numbers once into the source sheet → lock. No one edits live slides from five tabs.',
      },
      {
        label: 'Client send',
        channel: 'Email template',
        body: 'Subject: {{month}} performance — 3 decisions\n\n1) What worked 2) What didn’t 3) What we change next month. Deck + 4-line summary attached.',
      },
      {
        label: 'Async Q&A',
        channel: 'Email / Loom',
        body: 'Questions? Reply in-thread or book 15 mins. We don’t re-run the whole deck live unless numbers moved.',
      },
    ],
    closing: 'That’s fix number one. Automating the feed into the deck is the rest.',
  },
  {
    industry: 'general',
    leakCategory: 'admin',
    title: 'Admin batching starter',
    intro:
      'Your #1 leak is repetitive admin labour. Here’s a batching starter pack — free.',
    messages: [
      {
        label: 'Daily 25-min admin block',
        channel: 'Calendar',
        body: 'One protected block: inbox zero for deal-critical threads only, update pipeline stages, send outstanding quotes.',
      },
      {
        label: 'Status template',
        channel: 'Email / CRM note',
        body: 'Stage · Last touch · Next action · Owner · Blocker. Paste on every live deal Friday.',
      },
      {
        label: 'Stop-doing list',
        channel: 'Team note',
        body: 'Anything done 3× this week by hand gets a template or a zap — or it stays expensive forever.',
      },
    ],
    closing: 'That’s fix number one. The other six are what a call is for.',
  },
];

/**
 * Pick the free fix for this report: top leak category × industry, with general fallback.
 * @param {string} industryId
 * @param {string} leakCategoryId
 * @returns {FreeFix | null}
 */
export function pickFreeFix(industryId, leakCategoryId) {
  const industry = industryId || 'general';
  const cat = leakCategoryId || 'lost-leads';
  return (
    FREE_FIXES.find((f) => f.industry === industry && f.leakCategory === cat) ||
    FREE_FIXES.find((f) => f.industry === 'general' && f.leakCategory === cat) ||
    FREE_FIXES.find((f) => f.industry === industry && f.leakCategory === 'lost-leads') ||
    FREE_FIXES.find((f) => f.industry === 'general' && f.leakCategory === 'lost-leads') ||
    null
  );
}
