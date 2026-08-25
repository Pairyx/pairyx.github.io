/**
 * Pairyx intake — question definitions.
 *
 * Split out from apply.js so the questions can be edited without touching the
 * auth or submit logic.
 *
 * Each form is an ordered list of STEPS. One step renders per screen, because
 * fifty inputs on a single page is how you get a 20% completion rate.
 *
 * Field shape:
 *   k         key stored in the database (snake_case, stable — renaming one
 *             orphans every answer already collected under the old name)
 *   label     the question
 *   hint      why we're asking, or how to answer. Worth writing for anything
 *             a respondent might hesitate over — especially money.
 *   type      text | email | url | number | textarea | select | radio |
 *             checks | range
 *   required  only for things we genuinely cannot match without
 *
 * Most fields are deliberately optional. A creator who fills in eight boxes is
 * worth more than one who abandons at forty.
 */

/* ─────────────────────────────── vocabularies ─────────────────────────── */

export const CATEGORIES = [
  ['beauty_skincare', 'Beauty & skincare'], ['fashion_apparel', 'Fashion & apparel'],
  ['fitness_wellness', 'Fitness & wellness'], ['food_beverage', 'Food & beverage'],
  ['supplements', 'Supplements & nutrition'], ['consumer_tech', 'Consumer tech'],
  ['software_saas', 'Software / SaaS'], ['dev_tools', 'Developer tools'],
  ['gaming', 'Gaming'], ['finance', 'Finance & fintech'], ['crypto', 'Crypto & web3'],
  ['home_lifestyle', 'Home & lifestyle'], ['parenting', 'Parenting & family'],
  ['pets', 'Pets'], ['travel', 'Travel'], ['automotive', 'Automotive'],
  ['education', 'Education & courses'], ['entertainment', 'Entertainment & media'],
  ['sports_outdoors', 'Sports & outdoors'], ['b2b_services', 'B2B services'],
  ['other', 'Something else'],
]

const PLATFORMS = [
  ['youtube', 'YouTube'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'],
  ['twitch', 'Twitch'], ['x_twitter', 'X / Twitter'], ['podcast', 'Podcast'],
  ['newsletter', 'Newsletter'], ['linkedin', 'LinkedIn'], ['other', 'Somewhere else'],
]

const AGES = [
  ['13-17', '13–17'], ['18-24', '18–24'], ['25-34', '25–34'],
  ['35-44', '35–44'], ['45-54', '45–54'], ['55+', '55+'],
]

const DEALS = [
  ['cash', 'Flat cash'], ['cash_equity', 'Cash + equity'],
  ['cash_revshare', 'Cash + revenue share'], ['product', 'Product only'],
  ['affiliate', 'Affiliate / commission'], ['open', 'Open to discussion'],
]

const YES_NO = [['yes', 'Yes'], ['no', 'No']]

/* ══════════════════════════════ CREATOR ════════════════════════════════ */

export const CREATOR_FORM = [
  {
    legend: 'You',
    note: 'The basics, so we know who we\'re talking to.',
    fields: [
      { k: 'display_name', label: 'Name or channel name', type: 'text', required: true },
      { k: 'contact_email', label: 'Best email to reach you', type: 'email', required: true },
      { k: 'location', label: 'Where are you based?', type: 'text',
        hint: 'City and country. Some brands can only work in certain markets.',
        placeholder: 'Austin, US' },
      { k: 'years_creating', label: 'How long have you been creating?', type: 'select',
        options: [['under_1', 'Under a year'], ['1_2', '1–2 years'],
                  ['3_5', '3–5 years'], ['over_5', 'More than 5 years']] },
      { k: 'has_manager', label: 'Do you have a manager or agent?', type: 'radio', options: YES_NO },
      { k: 'manager_contact', label: 'Who should we copy in?', type: 'text',
        hint: 'Only if you said yes above.' },
    ],
  },
  {
    legend: 'Your reach',
    note: 'Rough numbers are fine. We use these to filter, never to rank you.',
    fields: [
      { k: 'primary_platform', label: 'Where is most of your audience?', type: 'select',
        options: PLATFORMS, required: true },
      { k: 'handles', label: 'Your handles or channel links', type: 'text', required: true,
        hint: 'All of them, comma separated.',
        placeholder: '@yourhandle, youtube.com/@you' },
      { k: 'primary_followers', label: 'Audience size on your main platform', type: 'number',
        required: true, hint: 'A round number is fine.', placeholder: '480000' },
      { k: 'youtube_subs', label: 'YouTube subscribers', type: 'number', placeholder: 'if any' },
      { k: 'instagram_followers', label: 'Instagram followers', type: 'number', placeholder: 'if any' },
      { k: 'tiktok_followers', label: 'TikTok followers', type: 'number', placeholder: 'if any' },
      { k: 'newsletter_subs', label: 'Newsletter subscribers', type: 'number', placeholder: 'if any' },
      { k: 'other_platforms', label: 'Anywhere else worth knowing about?', type: 'text',
        placeholder: 'Twitch 40k, Discord 12k' },
    ],
  },
  {
    legend: 'Your content',
    note: 'This is most of what we match on.',
    fields: [
      { k: 'niche_description', label: 'What is your content about?', type: 'textarea',
        required: true, hint: 'Your words, not a category label. Two or three sentences.' },
      { k: 'niche_category', label: 'Closest category', type: 'select',
        options: CATEGORIES, required: true },
      { k: 'secondary_category', label: 'Anything you also cover?', type: 'select', options: CATEGORIES },
      { k: 'content_formats', label: 'What do you make?', type: 'checks', required: true,
        options: [
          ['long_video', 'Long-form video'], ['shorts', 'Shorts / Reels / TikToks'],
          ['livestream', 'Livestreams'], ['podcast', 'Podcast'],
          ['newsletter', 'Newsletter'], ['static', 'Static posts / carousels'],
          ['blog', 'Blog / written'],
        ] },
      { k: 'posting_frequency', label: 'How often do you post?', type: 'select', required: true,
        options: [['daily', 'Daily or more'], ['few_week', 'A few times a week'],
                  ['weekly', 'Weekly'], ['biweekly', 'Every couple of weeks'],
                  ['monthly', 'Monthly'], ['irregular', 'Irregularly']] },
      { k: 'typical_length', label: 'Typical length of a main piece', type: 'text',
        placeholder: '15–20 minutes' },
      { k: 'content_pillars', label: 'Recurring series or formats?', type: 'textarea',
        hint: 'Named segments a brand could sponsor.' },
      { k: 'languages', label: 'What language do you publish in?', type: 'text',
        placeholder: 'English' },
      { k: 'production_setup', label: 'Who makes it?', type: 'select',
        options: [['solo', 'Just me'], ['solo_editor', 'Me plus an editor'],
                  ['small_team', 'Small team'], ['studio', 'Studio or agency']] },
    ],
  },
  {
    legend: 'Your audience',
    note: 'Estimates from your platform analytics are fine — we do not expect exact figures.',
    fields: [
      { k: 'audience_age_primary', label: 'Largest age group', type: 'select',
        options: AGES, required: true },
      { k: 'audience_age_secondary', label: 'Second largest', type: 'select', options: AGES },
      { k: 'audience_female_pct', label: 'Roughly what % is female?', type: 'number',
        hint: '0–100. An estimate is fine.', placeholder: '35' },
      { k: 'geo_1', label: 'Top country', type: 'text', required: true, placeholder: 'United States' },
      { k: 'geo_1_pct', label: '…roughly what % of your audience?', type: 'number', placeholder: '55' },
      { k: 'geo_2', label: 'Second country', type: 'text', placeholder: 'United Kingdom' },
      { k: 'geo_3', label: 'Third country', type: 'text', placeholder: 'Australia' },
      { k: 'audience_description', label: 'Describe your audience to someone who has never seen your work',
        type: 'textarea',
        hint: 'Who are they, what do they care about, why do they trust you? This one is genuinely useful.' },
    ],
  },
  {
    legend: 'How your content performs',
    note: 'The single most useful section. Follower count tells us almost nothing; these numbers tell us a lot.',
    fields: [
      { k: 'avg_views', label: 'Average views on a recent post', type: 'number', required: true,
        hint: 'Last 30 days, your main format.', placeholder: '120000' },
      { k: 'median_views', label: 'Median views', type: 'number',
        hint: 'If you know it. More honest than an average when one video went viral.' },
      { k: 'engagement_rate', label: 'Engagement rate (%)', type: 'number',
        hint: 'Likes plus comments over reach. Leave blank if you are unsure.', placeholder: '6' },
      { k: 'avg_comments', label: 'Typical comments per post', type: 'number' },
      { k: 'retention_pct', label: 'Average view duration or retention (%)', type: 'number',
        hint: 'Video creators — this is a strong signal for sponsored segments.', placeholder: '45' },
      { k: 'link_ctr', label: 'Click-through rate on links (%)', type: 'number',
        hint: 'Stories, description links, newsletter links.' },
      { k: 'best_performing', label: 'What has performed best recently, and why do you think it worked?',
        type: 'textarea' },
    ],
  },
  {
    legend: 'Brand work you have done',
    note: 'Past results are the strongest evidence we can show a brand. Ballpark numbers beat none.',
    fields: [
      { k: 'done_deals_before', label: 'Have you worked with brands before?', type: 'radio',
        options: YES_NO, required: true },
      { k: 'deals_last_12mo', label: 'How many in the last 12 months?', type: 'select',
        options: [['0', 'None'], ['1_3', '1–3'], ['4_10', '4–10'], ['over_10', 'More than 10']] },
      { k: 'brands_worked_with', label: 'Which brands?', type: 'textarea',
        hint: 'Names are enough. Skip any you are under NDA about.' },
      { k: 'best_deal_story', label: 'Which partnership went best, and why?', type: 'textarea' },
      { k: 'results_data', label: 'Any numbers you can share', type: 'textarea',
        hint: 'Clicks, code redemptions, conversions, ROAS — anything you have. This is what gets you a higher rate.' },
      { k: 'uses_promo_codes', label: 'Do you use promo codes or affiliate links?', type: 'radio',
        options: YES_NO },
      { k: 'has_media_kit', label: 'Do you have a media kit?', type: 'radio', options: YES_NO },
      { k: 'media_kit_url', label: 'Link to it', type: 'url', placeholder: 'https://' },
    ],
  },
  {
    legend: 'Rates and terms',
    note: 'Nothing here is a commitment, and brands never see these as a quote. It stops us bringing you deals that waste your time.',
    fields: [
      { k: 'rate', label: 'Your usual range for a brand deal (USD)', type: 'range', required: true,
        hint: 'Low end to high end.' },
      { k: 'rate_dedicated', label: 'Dedicated video or post', type: 'number', placeholder: '12000' },
      { k: 'rate_integrated', label: 'Integrated mention or segment', type: 'number', placeholder: '6000' },
      { k: 'rate_story', label: 'Story or short-form', type: 'number', placeholder: '1500' },
      { k: 'min_deal_size', label: 'Smallest deal worth your time', type: 'number', placeholder: '3000' },
      { k: 'deal_structures', label: 'Deal shapes you will accept', type: 'checks',
        options: DEALS, required: true },
      { k: 'usage_rights', label: 'Usage rights you will grant', type: 'checks',
        options: [
          ['organic', 'Organic only'], ['whitelisting', 'Paid amplification / whitelisting'],
          ['full', 'Full usage in brand ads'], ['negotiable', 'Negotiable'],
        ] },
      { k: 'exclusivity_ok', label: 'Will you accept category exclusivity?', type: 'radio',
        options: [['yes', 'Yes'], ['depends', 'Depends on the terms'], ['no', 'No']] },
      { k: 'turnaround', label: 'Typical turnaround once a deal is signed', type: 'select',
        options: [['under_1w', 'Under a week'], ['1_2w', '1–2 weeks'],
                  ['3_4w', '3–4 weeks'], ['over_4w', 'More than a month']] },
    ],
  },
  {
    legend: 'What you want',
    note: 'Last one.',
    fields: [
      { k: 'categories_wanted', label: 'Categories you would like more of', type: 'checks',
        options: CATEGORIES },
      { k: 'brand_exclusions', label: 'Anything you will not promote?', type: 'textarea',
        hint: 'Categories or specific brands. Leave blank if none.' },
      { k: 'dream_brands', label: 'Brands you would say yes to immediately', type: 'textarea' },
      { k: 'requires_trial', label: 'Do you need to try a product before promoting it?', type: 'radio',
        options: [['always', 'Always'], ['usually', 'Usually'], ['no', 'Not necessarily']] },
      { k: 'creative_control', label: 'How much creative control do you need?', type: 'select',
        options: [['full', 'Full — I write it my way'],
                  ['collaborative', 'Collaborative — talking points are fine'],
                  ['flexible', 'Flexible — I can work to a script']] },
      { k: 'anything_else', label: 'Anything else we should know?', type: 'textarea' },
    ],
  },
]

/* ══════════════════════════════ BRAND ══════════════════════════════════ */

export const BRAND_FORM = [
  {
    legend: 'Your company',
    note: 'Who you are.',
    fields: [
      { k: 'company_name', label: 'Company or brand name', type: 'text', required: true },
      { k: 'website', label: 'Website', type: 'url', required: true, placeholder: 'https://' },
      { k: 'contact_name', label: 'Your name', type: 'text', required: true },
      { k: 'contact_role', label: 'Your role', type: 'text', placeholder: 'Head of Growth' },
      { k: 'contact_email', label: 'Best email to reach you', type: 'email', required: true },
      { k: 'hq_location', label: 'Where are you based?', type: 'text', placeholder: 'London, UK' },
      { k: 'stage', label: 'Where is the business at?', type: 'select', required: true,
        options: [['prelaunch', 'Pre-launch'], ['early', 'Early revenue'],
                  ['growth', 'Growing fast'], ['established', 'Established'],
                  ['enterprise', 'Enterprise']] },
    ],
  },
  {
    legend: 'What you sell',
    note: 'The more specific, the better the shortlist.',
    fields: [
      { k: 'product_description', label: 'What do you sell?', type: 'textarea', required: true,
        hint: 'Plain language. A couple of sentences.' },
      { k: 'category', label: 'Closest category', type: 'select', options: CATEGORIES, required: true },
      { k: 'hero_product', label: 'Which product do you want promoted?', type: 'text' },
      { k: 'differentiator', label: 'Why do people buy it over the alternative?', type: 'textarea',
        hint: 'The honest answer, not the tagline.' },
      { k: 'price_point', label: 'Typical price or order value (USD)', type: 'number',
        hint: 'Helps us judge whether a creator\'s audience can afford it.', placeholder: '89' },
      { k: 'business_model', label: 'How does it sell?', type: 'select',
        options: [['dtc', 'Direct to consumer'], ['subscription', 'Subscription'],
                  ['marketplace', 'Marketplace'], ['retail', 'Retail / wholesale'],
                  ['b2b', 'B2B'], ['app', 'App / digital'], ['other', 'Other']] },
      { k: 'proof_points', label: 'Any proof we can point creators at?', type: 'textarea',
        hint: 'Reviews, results, clinical data, awards, notable customers.' },
      { k: 'can_send_product', label: 'Can you send product to creators?', type: 'radio',
        options: YES_NO },
    ],
  },
  {
    legend: 'Who you want to reach',
    note: 'Be specific. "Everyone" produces a bad shortlist.',
    fields: [
      { k: 'target_audience', label: 'Describe your ideal customer', type: 'textarea', required: true,
        hint: 'Who are they, and what makes them buy?' },
      { k: 'target_age', label: 'Primary age group', type: 'select', options: AGES, required: true },
      { k: 'target_age_secondary', label: 'Secondary age group', type: 'select', options: AGES },
      { k: 'target_gender', label: 'Any gender skew?', type: 'select',
        options: [['balanced', 'Fairly balanced'], ['mostly_female', 'Mostly female'],
                  ['mostly_male', 'Mostly male']] },
      { k: 'target_geos', label: 'Markets that matter', type: 'text', required: true,
        hint: 'Most important first.', placeholder: 'US, UK, Canada' },
      { k: 'target_income', label: 'Rough income bracket', type: 'select',
        options: [['budget', 'Budget conscious'], ['mid', 'Middle income'],
                  ['affluent', 'Affluent'], ['luxury', 'Luxury']] },
      { k: 'customer_interests', label: 'What else are they into?', type: 'textarea',
        hint: 'Adjacent interests often point at the best creators.' },
      { k: 'current_channels', label: 'How do you acquire customers today?', type: 'text',
        placeholder: 'Meta ads, SEO, retail' },
    ],
  },
  {
    legend: 'The campaign',
    note: 'What you actually want to happen.',
    fields: [
      { k: 'campaign_goal', label: 'What is this for?', type: 'select', required: true,
        options: [['awareness', 'Awareness'], ['conversions', 'Conversions / sales'],
                  ['launch', 'A launch'], ['ugc', 'Content for our own ads'],
                  ['credibility', 'Credibility / social proof'], ['other', 'Something else']] },
      { k: 'primary_kpi', label: 'How will you judge it?', type: 'text',
        hint: 'The one number that decides whether this worked.',
        placeholder: 'CAC under $40' },
      { k: 'timeline', label: 'When do you want this live?', type: 'text', required: true,
        placeholder: 'Within 6 weeks' },
      { k: 'creators_wanted', label: 'How many creators?', type: 'select',
        options: [['1', 'Just one'], ['2_5', '2–5'], ['6_15', '6–15'],
                  ['over_15', 'More than 15'], ['unsure', 'Not sure yet']] },
      { k: 'platforms_wanted', label: 'Which platforms?', type: 'checks', options: PLATFORMS },
      { k: 'formats_wanted', label: 'What kind of content?', type: 'checks',
        options: [
          ['dedicated', 'Dedicated video or post'], ['integration', 'Integration / mention'],
          ['shorts', 'Shorts / Reels'], ['story', 'Stories'],
          ['livestream', 'Livestream'], ['newsletter', 'Newsletter feature'],
          ['ugc_only', 'UGC for our ads, no posting'],
        ] },
      { k: 'needs_usage_rights', label: 'Will you want to run the content as paid ads?', type: 'radio',
        options: [['yes', 'Yes'], ['maybe', 'Maybe'], ['no', 'No']] },
      { k: 'needs_exclusivity', label: 'Do you need category exclusivity?', type: 'radio',
        options: [['yes', 'Yes'], ['maybe', 'Maybe'], ['no', 'No']] },
    ],
  },
  {
    legend: 'Budget',
    note: 'Never shown to creators. We use it to rule out anyone unrealistic before wasting your time or theirs.',
    fields: [
      { k: 'budget', label: 'Total budget for this (USD)', type: 'range', required: true },
      { k: 'per_creator_budget', label: 'Rough budget per creator (USD)', type: 'number',
        placeholder: '5000' },
      { k: 'budget_flexibility', label: 'How firm is that?', type: 'select', required: true,
        options: [['firm', 'Firm'], ['somewhat', 'Somewhat flexible'],
                  ['very', 'Very flexible for the right fit']] },
      { k: 'deal_structures', label: 'Deal shapes you can offer', type: 'checks',
        options: DEALS, required: true },
      { k: 'payment_terms', label: 'Payment terms you can offer', type: 'select',
        options: [['upfront', '100% upfront'], ['split', '50/50 split'],
                  ['on_delivery', 'On delivery'], ['net30', 'Net 30'], ['net60', 'Net 60']] },
      { k: 'budget_recurring', label: 'Is this one-off or ongoing?', type: 'radio',
        options: [['one_off', 'One-off'], ['ongoing', 'Ongoing if it works'],
                  ['unsure', 'Not sure yet']] },
    ],
  },
  {
    legend: 'What you have tried',
    note: 'Knowing what did not work is as useful as knowing what did.',
    fields: [
      { k: 'ran_before', label: 'Have you run creator campaigns before?', type: 'radio',
        options: YES_NO, required: true },
      { k: 'past_creators', label: 'Which creators?', type: 'textarea' },
      { k: 'what_worked', label: 'What worked?', type: 'textarea' },
      { k: 'what_didnt', label: 'What did not?', type: 'textarea',
        hint: 'Genuinely useful — it stops us repeating it.' },
      { k: 'past_results', label: 'Any numbers from those campaigns?', type: 'textarea',
        hint: 'ROAS, CPM, conversions, whatever you tracked.' },
      { k: 'why_now', label: 'Why are you looking now?', type: 'textarea' },
    ],
  },
  {
    legend: 'Fit and guardrails',
    note: 'Last one.',
    fields: [
      { k: 'brand_values', label: 'What does your brand stand for?', type: 'textarea',
        hint: 'The tone a creator would need to match.' },
      { k: 'creative_guidelines', label: 'How prescriptive are you about the content?', type: 'select',
        options: [['strict', 'Strict — we supply a script'],
                  ['guidelines', 'Guidelines and talking points'],
                  ['loose', 'Loose — the creator knows their audience']] },
      { k: 'approval_process', label: 'Who signs off, and how long does it take?', type: 'text',
        placeholder: 'Founder, 2 days' },
      { k: 'competitors_avoid', label: 'Competitors a creator must not have worked with', type: 'textarea' },
      { k: 'creator_exclusions', label: 'Creator types or content you want to avoid', type: 'textarea' },
      { k: 'dealbreakers', label: 'Anything that is an automatic no?', type: 'textarea' },
      { k: 'anything_else', label: 'Anything else we should know?', type: 'textarea' },
    ],
  },
]

export const COPY = {
  brand: {
    eyebrow: 'FOR BRANDS',
    title: "Tell us what you're building.",
    lede: 'Starred questions are the ones we need. Everything else sharpens the shortlist — answer what you can.',
    done: "We'll read this properly and come back with creators who actually fit, plus why we picked each one.",
  },
  creator: {
    eyebrow: 'FOR CREATORS',
    title: 'Tell us about your audience.',
    lede: 'Starred questions are the ones we need. The rest is what gets you better deals — especially the performance numbers.',
    done: "We'll come back when we have brands worth your name, with the reasoning laid out.",
  },
}

export function formFor(role) {
  return role === 'brand' ? BRAND_FORM : CREATOR_FORM
}
