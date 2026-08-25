/**
 * Pairyx — /apply
 *
 * Sign-in (Supabase magic link) + the client intake form.
 *
 * This runs on GitHub Pages, which serves static files only — there is no
 * server of ours in the request path. That shapes two things:
 *
 *   1. Auth is Supabase's hosted auth, called from the browser. The anon key
 *      below is PUBLIC by design; row-level security in Postgres is what
 *      actually protects the data, not the secrecy of this key.
 *   2. Email delivery goes through Web3Forms, because a static page cannot
 *      send mail itself. Submissions are written to Supabase FIRST, so a
 *      failed email never loses an application.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3'

/* ══════════════════════════════════════════════════════════════════════
   CONFIG — the two values you may need to touch
   ══════════════════════════════════════════════════════════════════════ */

const SUPABASE_URL = 'https://qrdpspagttxrsumbnzxa.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZHBzcGFndHR4cnN1bWJuenhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNTc0NzgsImV4cCI6MjEwMjYzMzQ3OH0.YHvqcrnvqRH0khAFGZ3eFUyem9aiE1B97UlEx3W_dRk'

// Web3Forms access key — this is what emails submissions to you.
// Get one free in ~30 seconds at https://web3forms.com (enter team@pairyx.co,
// they email you the key). Paste it here. Until it's set, applications still
// save to Supabase; they just don't land in your inbox.
const WEB3FORMS_KEY = ''

const NOTIFY_EMAIL = 'team@pairyx.co'

/* ══════════════════════════════════════════════════════════════════════ */

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

const $ = (id) => document.getElementById(id)
const views = ['loading', 'signin', 'sent', 'role', 'form', 'done']
function show(name) {
  for (const v of views) $(`view-${v}`).hidden = v !== name
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

let session = null
let role = null
let isPreview = false

/* ────────────────────────────────── field definitions ───────────────── */

const CATEGORIES = [
  ['beauty_skincare', 'Beauty & skincare'], ['fashion_apparel', 'Fashion & apparel'],
  ['fitness_wellness', 'Fitness & wellness'], ['food_beverage', 'Food & beverage'],
  ['supplements', 'Supplements & nutrition'], ['consumer_tech', 'Consumer tech'],
  ['software_saas', 'Software / SaaS'], ['dev_tools', 'Developer tools'],
  ['gaming', 'Gaming'], ['finance', 'Finance & fintech'],
  ['home_lifestyle', 'Home & lifestyle'], ['parenting', 'Parenting & family'],
  ['pets', 'Pets'], ['travel', 'Travel'], ['automotive', 'Automotive'],
  ['education', 'Education & courses'], ['entertainment', 'Entertainment & media'],
  ['b2b_services', 'B2B services'], ['other', 'Something else'],
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

const BRAND_FORM = [
  { legend: 'Your company', fields: [
    { k: 'company_name', label: 'Company or brand name', type: 'text', required: true },
    { k: 'website', label: 'Website', type: 'url', placeholder: 'https://' },
    { k: 'product_description', label: 'What do you sell?', type: 'textarea', required: true,
      hint: 'In your own words — a couple of sentences is plenty.' },
    { k: 'category', label: 'Closest category', type: 'select', options: CATEGORIES, required: true },
  ]},
  { legend: 'Who you want to reach', fields: [
    { k: 'target_audience', label: 'Describe your target customer', type: 'textarea', required: true,
      hint: 'Who are they, and what makes them buy?' },
    { k: 'target_age', label: 'Primary age group', type: 'select', options: AGES, required: true },
    { k: 'target_geos', label: 'Markets that matter', type: 'text',
      hint: 'Most important first. e.g. US, UK, Canada', placeholder: 'US, UK, Canada' },
  ]},
  { legend: 'Commercials', fields: [
    { k: 'budget', label: 'Campaign budget (USD)', type: 'range', required: true,
      hint: 'Never shown to creators. We use it to filter out anyone unrealistic.' },
    { k: 'budget_flexibility', label: 'How firm is that?', type: 'select', required: true,
      options: [['firm', 'Firm'], ['somewhat', 'Somewhat flexible'], ['very', 'Very flexible']] },
    { k: 'deal_structures', label: 'Deal shapes you can offer', type: 'checks',
      options: DEALS, required: true },
  ]},
  { legend: 'Fit', fields: [
    { k: 'brand_values', label: 'What does your brand stand for?', type: 'textarea',
      hint: 'The tone a creator would need to match.' },
    { k: 'timeline', label: 'When do you want this live?', type: 'text',
      placeholder: 'e.g. within 6 weeks' },
    { k: 'exclusions', label: 'Anyone or anything to avoid?', type: 'textarea',
      hint: 'Competitors, creator types, categories. Leave blank if none.' },
  ]},
]

const CREATOR_FORM = [
  { legend: 'You', fields: [
    { k: 'display_name', label: 'Name or channel name', type: 'text', required: true },
    { k: 'primary_platform', label: 'Where is most of your audience?', type: 'select',
      options: PLATFORMS, required: true },
    { k: 'handles', label: 'Your handles or channel links', type: 'text', required: true,
      placeholder: '@yourhandle, youtube.com/@you' },
    { k: 'follower_count', label: 'Audience size on that platform', type: 'number', required: true,
      hint: 'A round number is fine.', placeholder: '480000' },
  ]},
  { legend: 'Your content', fields: [
    { k: 'niche_description', label: 'What is your content about?', type: 'textarea', required: true,
      hint: 'Your words, not a category label.' },
    { k: 'niche_category', label: 'Closest category', type: 'select', options: CATEGORIES, required: true },
    { k: 'content_style', label: 'Format and tone', type: 'textarea',
      hint: 'e.g. long-form tutorials, short comedic skits, deep-dive reviews.' },
  ]},
  { legend: 'Your audience', fields: [
    { k: 'audience_age', label: 'Largest age group', type: 'select', options: AGES, required: true },
    { k: 'audience_female_pct', label: 'Roughly what % is female?', type: 'number',
      hint: 'An estimate from your analytics is fine.', placeholder: '35' },
    { k: 'audience_geos', label: 'Top countries', type: 'text', placeholder: 'US, UK, Australia' },
    { k: 'engagement_notes', label: 'Anything notable about your community?', type: 'textarea',
      hint: 'Comment culture, conversion, how they respond to sponsorships.' },
  ]},
  { legend: 'Commercials', fields: [
    { k: 'rate', label: 'Your usual rate for a brand deal (USD)', type: 'range',
      hint: 'A range is fine. Not a commitment — brands never see this as a quote.' },
    { k: 'deal_structures', label: 'Deal shapes you will accept', type: 'checks',
      options: DEALS, required: true },
    { k: 'brand_exclusions', label: 'Anything you will not promote?', type: 'textarea',
      hint: 'Categories or brands. Leave blank if none.' },
  ]},
]

const COPY = {
  brand: {
    eyebrow: 'FOR BRANDS',
    title: "Tell us what you're building.",
    lede: 'The more specific you are, the better the shortlist. Everything here stays between you and the Pairyx team.',
    done: "We'll read this properly and come back with creators who actually fit — plus why we picked each one.",
  },
  creator: {
    eyebrow: 'FOR CREATORS',
    title: 'Tell us about your audience.',
    lede: "This is what we match on — not follower count. Be honest about the numbers; it's what stops us wasting your time.",
    done: "We'll come back when we have brands worth your name, with the reasoning laid out.",
  },
}

/* ────────────────────────────────── render ──────────────────────────── */

function fieldHTML(f) {
  const req = f.required ? '<span class="req">*</span>' : ''
  const hint = f.hint ? `<span class="hint">${f.hint}</span>` : ''
  const ph = f.placeholder ? ` placeholder="${f.placeholder}"` : ''
  let control

  switch (f.type) {
    case 'textarea':
      control = `<textarea id="f-${f.k}" name="${f.k}" rows="3"${ph}></textarea>`
      break
    case 'select':
      control =
        `<select id="f-${f.k}" name="${f.k}">` +
        `<option value="">Choose one…</option>` +
        f.options.map(([v, l]) => `<option value="${v}">${l}</option>`).join('') +
        `</select>`
      break
    case 'checks':
      control =
        `<div class="checks" id="f-${f.k}">` +
        f.options
          .map(
            ([v, l]) =>
              `<label class="check"><input type="checkbox" name="${f.k}" value="${v}"><span>${l}</span></label>`,
          )
          .join('') +
        `</div>`
      break
    case 'range':
      control =
        `<div class="two">` +
        `<input id="f-${f.k}_min" name="${f.k}_min" type="number" min="0" step="100" placeholder="Low end">` +
        `<input id="f-${f.k}_max" name="${f.k}_max" type="number" min="0" step="100" placeholder="High end">` +
        `</div>`
      break
    case 'number':
      control = `<input id="f-${f.k}" name="${f.k}" type="number" min="0"${ph}>`
      break
    default:
      control = `<input id="f-${f.k}" name="${f.k}" type="${f.type}"${ph}>`
  }

  return `<div class="field" data-field="${f.k}"${f.required ? ' data-required="1"' : ''}${
    f.type === 'range' ? ' data-range="1"' : ''
  }${f.type === 'checks' ? ' data-checks="1"' : ''}>
    <label for="f-${f.k}">${f.label}${req}</label>
    ${hint}
    ${control}
    <span class="err"></span>
  </div>`
}

function renderForm() {
  const spec = role === 'brand' ? BRAND_FORM : CREATOR_FORM
  const c = COPY[role]
  $('form-eyebrow').textContent = c.eyebrow
  $('form-title').textContent = c.title
  $('form-lede').textContent = c.lede
  $('form-fields').innerHTML = spec
    .map(
      (g) =>
        `<fieldset class="fieldset"><legend class="legend">${g.legend}</legend>${g.fields
          .map(fieldHTML)
          .join('')}</fieldset>`,
    )
    .join('')
  updateProgress()
  $('intake-form').addEventListener('input', updateProgress)
  $('intake-form').addEventListener('change', updateProgress)
}

function updateProgress() {
  const groups = [...document.querySelectorAll('#form-fields .field')]
  const done = groups.filter((g) => readField(g).filled).length
  $('form-progress').style.width = `${Math.round((done / groups.length) * 100)}%`
}

/* ────────────────────────────────── read + validate ─────────────────── */

function readField(el) {
  const key = el.dataset.field
  if (el.dataset.checks) {
    const vals = [...el.querySelectorAll('input:checked')].map((i) => i.value)
    return { key, value: vals, filled: vals.length > 0 }
  }
  if (el.dataset.range) {
    const lo = el.querySelector(`[name="${key}_min"]`).value.trim()
    const hi = el.querySelector(`[name="${key}_max"]`).value.trim()
    return { key, value: lo || hi ? { min: lo, max: hi } : null, filled: Boolean(lo && hi), lo, hi }
  }
  const input = el.querySelector('input, select, textarea')
  const v = input.value.trim()
  return { key, value: v, filled: v !== '' }
}

function validate() {
  let firstBad = null
  const answers = {}

  for (const el of document.querySelectorAll('#form-fields .field')) {
    const r = readField(el)
    el.classList.remove('invalid')
    const err = el.querySelector('.err')

    if (el.dataset.required && !r.filled) {
      el.classList.add('invalid')
      err.textContent = el.dataset.checks
        ? 'Pick at least one.'
        : el.dataset.range
          ? 'Both ends of the range, please.'
          : 'This one we need.'
      firstBad = firstBad || el
      continue
    }

    // A range that is filled must not be inverted — the API can't catch this.
    if (el.dataset.range && r.filled && Number(r.lo) > Number(r.hi)) {
      el.classList.add('invalid')
      err.textContent = 'The low end is higher than the high end.'
      firstBad = firstBad || el
      continue
    }

    if (r.filled) answers[r.key] = r.value
  }

  return { ok: !firstBad, firstBad, answers }
}

/* ────────────────────────────────── submit ──────────────────────────── */

function prettyBody(answers) {
  const spec = role === 'brand' ? BRAND_FORM : CREATOR_FORM
  const labels = {}
  for (const g of spec) for (const f of g.fields) labels[f.k] = f.label

  const lines = [`${role === 'brand' ? 'BRAND' : 'CREATOR'} APPLICATION`, '']
  lines.push(`Account email: ${session.user.email}`)
  lines.push(`Submitted:     ${new Date().toLocaleString()}`)
  lines.push('')
  for (const [k, v] of Object.entries(answers)) {
    const label = labels[k] || k
    let val = v
    if (Array.isArray(v)) val = v.join(', ')
    else if (v && typeof v === 'object') val = `${v.min} – ${v.max}`
    lines.push(`${label}: ${val}`)
  }
  return lines.join('\n')
}

async function submit(e) {
  e.preventDefault()
  const btn = $('submit-btn')
  const errBox = $('form-error')
  errBox.hidden = true

  const { ok, firstBad, answers } = validate()
  if (!ok) {
    errBox.textContent = 'A few answers are missing — they’re marked below.'
    errBox.hidden = false
    firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' })
    firstBad.querySelector('input, select, textarea')?.focus()
    return
  }

  if (!session) {
    errBox.textContent = 'Your sign-in expired. Please sign in again — nothing you typed is lost.'
    errBox.hidden = false
    return
  }

  btn.disabled = true
  btn.textContent = 'Sending…'

  if (isPreview) {
    console.info('[apply] preview mode — validation passed, nothing was saved.', answers)
    $('done-lede').textContent = COPY[role].done
    show('done')
    btn.disabled = false
    btn.textContent = 'Send my application'
    return
  }

  // Store first. If the email step fails we still have the application.
  const { error: dbError } = await supabase.from('applications').insert({
    user_id: session.user.id,
    intake_role: role,
    email: session.user.email,
    answers,
  })

  if (dbError) {
    console.error('[apply] save failed', dbError)
    errBox.textContent =
      "We couldn't save that — please try again. If it keeps happening, email team@pairyx.co and we'll take it from there."
    errBox.hidden = false
    btn.disabled = false
    btn.textContent = 'Send my application'
    return
  }

  // Then notify. A failure here is logged, not surfaced: the application is
  // already safe, and telling someone their submission failed when it didn't
  // is worse than a delayed email.
  if (WEB3FORMS_KEY) {
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `New ${role} application — ${answers.company_name || answers.display_name || session.user.email}`,
          from_name: 'Pairyx intake',
          email: session.user.email,
          message: prettyBody(answers),
        }),
      })
    } catch (err) {
      console.error('[apply] email notification failed (application was saved)', err)
    }
  } else {
    console.warn('[apply] WEB3FORMS_KEY is not set — saved to Supabase, no email sent.')
  }

  $('done-lede').textContent = COPY[role].done
  show('done')
}

/* ────────────────────────────────── auth ────────────────────────────── */

async function sendLink(e) {
  e.preventDefault()
  const email = $('signin-email').value.trim()
  const btn = $('signin-btn')
  const errBox = $('signin-error')
  errBox.hidden = true

  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
    errBox.textContent = "That doesn't look like an email address."
    errBox.hidden = false
    return
  }

  btn.disabled = true
  btn.textContent = 'Sending…'

  const url = new URL(window.location.href)
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: url.origin + url.pathname + (role ? `?role=${role}` : '') },
  })

  btn.disabled = false
  btn.textContent = 'Email me a link'

  if (error) {
    errBox.textContent = error.message
    errBox.hidden = false
    return
  }

  $('sent-email').textContent = email
  show('sent')
}

function routeSignedIn() {
  $('px-navcta').hidden = false
  const wanted = new URL(window.location.href).searchParams.get('role')
  if (wanted === 'brand' || wanted === 'creator') {
    role = wanted
    renderForm()
    show('form')
  } else {
    show('role')
  }
}

/* ────────────────────────────────── wire up ─────────────────────────── */

$('signin-form').addEventListener('submit', sendLink)
$('sent-again').addEventListener('click', () => show('signin'))
$('intake-form').addEventListener('submit', submit)

$('back-btn').addEventListener('click', () => {
  role = null
  const u = new URL(window.location.href)
  u.searchParams.delete('role')
  history.replaceState({}, '', u)
  show('role')
})

$('another-btn').addEventListener('click', () => {
  role = null
  show('role')
})

for (const card of document.querySelectorAll('.rolecard')) {
  card.addEventListener('click', () => {
    role = card.dataset.role
    const u = new URL(window.location.href)
    u.searchParams.set('role', role)
    history.replaceState({}, '', u)
    renderForm()
    show('form')
  })
}

$('px-navcta').addEventListener('click', async () => {
  await supabase.auth.signOut()
  window.location.href = window.location.pathname
})

supabase.auth.onAuthStateChange((event, s) => {
  // Never clobber the local preview session.
  if (isPreview) return

  if (s) {
    session = s
    routeSignedIn()
    return
  }

  // A null session means signed out or a refresh that failed. Dropping the
  // person back to sign-in beats leaving a dead form on screen that only
  // fails when they hit submit.
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESH_FAILED') {
    session = null
    $('px-navcta').hidden = true
    show('signin')
  }
})

/**
 * Local preview: ?preview=brand or ?preview=creator renders the form without
 * signing in, so form edits can be checked without a round trip through email.
 *
 * Gated to localhost — on pairyx.co this branch is unreachable, and it never
 * writes to the database (submitting in preview mode is blocked below).
 */
const IS_LOCAL = ['localhost', '127.0.0.1', '::1'].includes(location.hostname)

;(async function boot() {
  const previewRole = new URL(window.location.href).searchParams.get('preview')
  if (IS_LOCAL && (previewRole === 'brand' || previewRole === 'creator')) {
    isPreview = true
    role = previewRole
    session = { user: { id: 'preview', email: 'preview@localhost' } }
    renderForm()
    show('form')
    return
  }

  const { data } = await supabase.auth.getSession()
  session = data.session
  if (session) routeSignedIn()
  else {
    // Carry ?role= through sign-in so we come back to the right form.
    const wanted = new URL(window.location.href).searchParams.get('role')
    if (wanted === 'brand' || wanted === 'creator') role = wanted
    show('signin')
  }
})()
