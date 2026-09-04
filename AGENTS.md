# TRIGOR4 — Codex Operating Brief

## Mission
Turn TRIGOR4 into a reliable, commercially usable B2B SaaS whose immediate objective is to win and retain the first paying BTP customers. Prioritize revenue, evidence, reliability and speed over speculative features.

## Product
TRIGOR4 detects public economic/procurement events that can indicate a new commercial need for BTP companies, initially in Île-de-France. Customer-facing language should say **opportunities**, **need detected**, **priority**, **score**, **reliability** and **recommended action**. Do not present inferred subcontracting/capacity needs as facts.

Core promise:
- Find companies that have just triggered a new need.
- Be there before competitors.
- The market has just been won; the need starts now.

TRIGOR4 is not a tender newsletter, generic tender search engine or CRM. Its differentiation is: event -> inference -> qualification -> prioritization -> commercial action/routing.

## Immediate business target
First prove willingness to pay for Founder Pro at **49 EUR HT/month**. The funnel is:
prospect -> personalized free sample of 10 relevant opportunities -> usefulness confirmed -> Stripe subscription -> customer.
Do not add large feature sets before this funnel works.

## Current stack
- GitHub repo: prvyz/Trigora
- Supabase project: trigora, ref zayhtcwhmckrfzxkatcz
- Vercel project: trigora-v1
- Sources: BOAMP and DECP
- Initial technical BTP keywords: plomberie, chauffage, climatisation, électricité, maintenance, ventilation/CVC
- Initial geography: Île-de-France departments 91, 77, 94, 92, 93, 78, 95; national ingestion may exist but commercial wedge remains IDF.
- Payment: Stripe recurring 49 EUR HT/month Founder Pro.

## Architecture
OPEN DATA -> EVENT ENGINE -> ENTITY ENGINE -> INTENT ENGINE -> MATCH ENGINE -> MONETIZATION -> FEEDBACK.
Important entities: companies, buyers, contracts, events, signals, signal_relations, partner_offers, signal_matches, signal_conversions, ingestion_runs, prospects.

## Data rules
- Preserve source traceability for every commercial opportunity.
- BOAMP and DECP are authoritative source inputs; retain source URL/source identifiers.
- DECP can contain multiple rows/lots/modifications. Avoid double-counting where possible.
- Distinguish raw evidence from inferred intent.
- Keep intent confidence separate from evidence/source confidence.
- Never invent company details, partner terms, conversion rates or market facts.
- Any expected revenue is a scenario/estimate unless backed by an actual recorded conversion.
- Filter synthetic/test placeholder records.

## Signal quality
A high score must mean commercially interesting, not merely technically matched. Prefer:
1. recent event
2. relevant BTP activity
3. clear award/notification evidence
4. meaningful amount/duration when available
5. strong company/entity resolution
6. clear explanation of why the opportunity matters
7. source traceability.

Post-award events can indicate capacity, subcontracting, financing, recruitment or supplier needs, but these are hypotheses unless explicit evidence exists.

## Monetization
Only activate partner offers when commercial terms are verified. Never create fake partner logos or payouts. Current verified partner slot is Obat affiliation; its payout must be treated as configured commercial metadata, not guaranteed revenue. Track clicks and actual conversions separately.

## Security
- Never expose Supabase service-role/secret keys client-side.
- Keep privileged operations server-side.
- Maintain RLS and least-privilege access.
- Public Edge Functions must be deliberately protected where appropriate; do not weaken security to make tests pass.
- Do not touch any Supabase project belonging to HeistPlan.

## Production rules
Before changing production behavior:
1. inspect existing implementation;
2. make the smallest coherent change;
3. test the affected path;
4. run regression checks where practical;
5. verify deployment and critical endpoints;
6. report blockers explicitly.
Never claim a feature is complete without evidence.

## Current commercial priority backlog
P0 — Make first sale possible:
- Verify the landing-page CTA/form actually captures a prospect and can deliver a real 10-opportunity sample.
- Build a trustworthy opportunity/sample presentation with company, market, amount, date, location, why relevant, score, recommended action and official source.
- Verify Stripe checkout end-to-end without charging a test customer unexpectedly.
- Ensure post-payment state/access can be reconciled reliably; prefer webhook-based fulfillment if architecture permits.
- Make prospect status tracking usable: new -> qualified -> sample -> demo/trial -> customer/lost/nurture.
- Add basic observability/error handling around lead capture and sample delivery.

P1 — Improve conversion:
- Personalize opportunity packs by prospect sector/geography.
- Improve score explanation and trust signals.
- Add strong but accurate conversion CTAs.
- Track funnel metrics: contacted, response, sample requested, sample delivered, interested, checkout started, paid.
- Keep the first 30 prospects manageable; do not build mass outbound automation prematurely.

P2 — Improve engine:
- Better entity resolution.
- Consolidate DECP lots at company level where justified.
- Improve commercial quality scoring vs raw evidence score.
- Improve intent confidence.
- Improve source URL handling and upstream latency/filter robustness.
- Expand partner categories only after verified offers exist.

P3 — Scale:
- Better enrichment via SIRENE/INSEE after signal quality is proven.
- National expansion after IDF wedge validates.
- More verticals only after BTP conversion evidence.

## UX/content rules
- Customer-facing wording: opportunity, need, priority, score, evidence, action.
- Avoid jargon such as signal graph in the primary marketing copy.
- The product should feel like a commercial radar, not an analytics dashboard.
- Always show why an opportunity is actionable.
- Do not overpromise: detection is not proof of subcontracting need.

## Testing priorities
At minimum, test:
- landing page loads;
- lead form submission;
- dashboard feed;
- sample generation/delivery path;
- Stripe checkout link;
- redirect/tracking path;
- Supabase Edge Functions expected methods and error responses;
- no client-side secrets;
- no regressions to ingestion.

## Scope discipline
Do not:
- rebuild the product for aesthetics alone;
- add speculative AI features without measurable commercial benefit;
- replace working infrastructure without a clear gain;
- alter HeistPlan;
- fabricate data to make demos look better.

## Definition of "ready for first sales"
A prospect can receive a credible personalized sample in minutes, understand at a glance why each opportunity matters, click through to official evidence, and move to a working 49 EUR HT/month checkout. The founder can see the prospect status and basic conversion events. Production is stable enough to repeat this process for the first 30 prospects.

## Codex working style
Act autonomously within this repository. Inspect before editing. Prefer small, testable commits. When a task has multiple independent implementation pieces, complete the highest-impact piece first. If blocked by missing credentials or external human action, document the exact blocker and continue with everything else that can be done safely. Do not wait for unnecessary clarification when a reasonable implementation choice is supported by this brief.
