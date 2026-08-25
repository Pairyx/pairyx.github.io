/**
 * Pairyx — /apply
 *
 * A multi-step client intake form. No login for now — anyone with the link
 * can fill it out; the form's own "best email to reach you" field is what
 * identifies the submitter.
 *
 * This runs on GitHub Pages, which serves static files only — there is no
 * server of ours in the request path. That shapes two things:
 *
 *   1. Submissions write to Supabase directly from the browser. The anon key
 *      below is PUBLIC by design; row-level security in Postgres is what
 *      actually protects the data (insert-only, no read), not the secrecy
 *      of this key.
 *   2. Email delivery goes through Web3Forms, because a static page cannot
 *      send mail itself. Submissions are written to Supabase FIRST, so a
 *      failed email never loses an application.
 *
 * The questions live in forms.js. Edit them there.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3'
import { formFor, COPY } from './forms.js'

/* ══════════════════════════════════════════════════════════════════════
   CONFIG
   ══════════════════════════════════════════════════════════════════════ */

const SUPABASE_URL = 'https://qrdpspagttxrsumbnzxa.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZHBzcGFndHR4cnN1bWJuenhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNTc0NzgsImV4cCI6MjEwMjYzMzQ3OH0.YHvqcrnvqRH0khAFGZ3eFUyem9aiE1B97UlEx3W_dRk'

// Web3Forms access key — this is what emails submissions to you.
// Free, ~30 seconds, no account: https://web3forms.com (enter team@pairyx.co,
// they email you the key). Until it is set, applications still save to
// Supabase; they just do not land in your inbox.
const WEB3FORMS_KEY = 'c25cce79-b66b-4fd0-9639-9ee6ba2147a4'

/* ══════════════════════════════════════════════════════════════════════ */

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const $ = (id) => document.getElementById(id)
const views = ['role', 'form', 'done']
function show(name) {
  for (const v of views) $(`view-${v}`).hidden = v !== name
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

let role = null
let isPreview = false
let step = 0
/** Answers survive step navigation, so going Back never loses anything. */
let answers = {}

/* ────────────────────────────────── render ──────────────────────────── */

function fieldHTML(f) {
  const req = f.required ? '<span class="req" title="Required">*</span>' : ''
  const hint = f.hint ? `<span class="hint">${f.hint}</span>` : ''
  const ph = f.placeholder ? ` placeholder="${f.placeholder}"` : ''
  let control

  switch (f.type) {
    case 'textarea':
      control = `<textarea id="f-${f.k}" name="${f.k}" rows="3"${ph}></textarea>`
      break
    case 'select':
      control =
        `<select id="f-${f.k}" name="${f.k}"><option value="">Choose one…</option>` +
        f.options.map(([v, l]) => `<option value="${v}">${l}</option>`).join('') +
        `</select>`
      break
    case 'radio':
      control =
        `<div class="checks" id="f-${f.k}">` +
        f.options
          .map(
            ([v, l]) =>
              `<label class="check"><input type="radio" name="${f.k}" value="${v}"><span>${l}</span></label>`,
          )
          .join('') +
        `</div>`
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

  const flags =
    (f.required ? ' data-required="1"' : '') +
    (f.type === 'range' ? ' data-range="1"' : '') +
    (f.type === 'checks' ? ' data-checks="1"' : '') +
    (f.type === 'radio' ? ' data-radio="1"' : '')

  return `<div class="field" data-field="${f.k}"${flags}>
    <label for="f-${f.k}">${f.label}${req}</label>
    ${hint}
    ${control}
    <span class="err"></span>
  </div>`
}

function renderStep() {
  const spec = formFor(role)
  const s = spec[step]

  $('form-fields').innerHTML =
    `<fieldset class="fieldset">
       <legend class="legend">${s.legend}</legend>
       ${s.note ? `<p class="stepnote">${s.note}</p>` : ''}
       ${s.fields.map(fieldHTML).join('')}
     </fieldset>`

  restoreStep()

  $('step-count').textContent = `Step ${step + 1} of ${spec.length}`
  $('form-progress').style.width = `${((step + 1) / spec.length) * 100}%`

  const last = step === spec.length - 1
  $('next-btn').hidden = last
  $('submit-btn').hidden = !last
  $('back-btn').textContent = step === 0 ? 'Change role' : 'Back'

  $('form-error').hidden = true
  $('form-fields').querySelector('input, select, textarea')?.focus()
}

/** Put previously-entered answers back when returning to a step. */
function restoreStep() {
  for (const el of document.querySelectorAll('#form-fields .field')) {
    const key = el.dataset.field
    const saved = answers[key]
    if (saved === undefined) continue

    if (el.dataset.checks) {
      for (const i of el.querySelectorAll('input')) i.checked = saved.includes(i.value)
    } else if (el.dataset.radio) {
      for (const i of el.querySelectorAll('input')) i.checked = i.value === saved
    } else if (el.dataset.range) {
      el.querySelector(`[name="${key}_min"]`).value = saved.min ?? ''
      el.querySelector(`[name="${key}_max"]`).value = saved.max ?? ''
    } else {
      el.querySelector('input, select, textarea').value = saved
    }
  }
}

/* ────────────────────────────── read + validate ─────────────────────── */

function readField(el) {
  const key = el.dataset.field
  if (el.dataset.checks) {
    const vals = [...el.querySelectorAll('input:checked')].map((i) => i.value)
    return { key, value: vals, filled: vals.length > 0 }
  }
  if (el.dataset.radio) {
    const picked = el.querySelector('input:checked')
    return { key, value: picked ? picked.value : '', filled: Boolean(picked) }
  }
  if (el.dataset.range) {
    const lo = el.querySelector(`[name="${key}_min"]`).value.trim()
    const hi = el.querySelector(`[name="${key}_max"]`).value.trim()
    return { key, value: lo || hi ? { min: lo, max: hi } : null, filled: Boolean(lo && hi), lo, hi }
  }
  const input = el.querySelector('input, select, textarea')
  const v = input.value.trim()
  return { key, value: v, filled: v !== '', input }
}

/** Validates the visible step only, and folds its answers into `answers`. */
function commitStep() {
  let firstBad = null

  for (const el of document.querySelectorAll('#form-fields .field')) {
    const r = readField(el)
    el.classList.remove('invalid')
    const err = el.querySelector('.err')

    if (el.dataset.required && !r.filled) {
      el.classList.add('invalid')
      err.textContent = el.dataset.checks
        ? 'Pick at least one.'
        : el.dataset.radio
          ? 'Pick one.'
          : el.dataset.range
            ? 'Both ends, please.'
            : 'This one we need.'
      firstBad = firstBad || el
      continue
    }

    // A JSON schema cannot express min <= max, so it is checked here.
    if (el.dataset.range && r.filled && Number(r.lo) > Number(r.hi)) {
      el.classList.add('invalid')
      err.textContent = 'The low end is higher than the high end.'
      firstBad = firstBad || el
      continue
    }

    if (r.input && r.input.type === 'email' && r.filled &&
        !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(r.value)) {
      el.classList.add('invalid')
      err.textContent = "That does not look like an email address."
      firstBad = firstBad || el
      continue
    }

    if (r.filled) answers[r.key] = r.value
    else delete answers[r.key]
  }

  return { ok: !firstBad, firstBad }
}

function flagStep(firstBad) {
  const box = $('form-error')
  box.textContent = 'A couple of answers are missing — they are marked below.'
  box.hidden = false
  firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' })
  firstBad.querySelector('input, select, textarea')?.focus()
}

/* ────────────────────────────────── submit ──────────────────────────── */

function prettyBody() {
  const spec = formFor(role)
  const labels = {}
  for (const g of spec) for (const f of g.fields) labels[f.k] = f.label

  const lines = [
    `${role === 'brand' ? 'BRAND' : 'CREATOR'} APPLICATION`,
    '',
    `Submitted: ${new Date().toLocaleString()}`,
    '',
  ]

  for (const g of spec) {
    const rows = g.fields.filter((f) => answers[f.k] !== undefined)
    if (!rows.length) continue
    lines.push(`-- ${g.legend.toUpperCase()} --`)
    for (const f of rows) {
      let v = answers[f.k]
      if (Array.isArray(v)) v = v.join(', ')
      else if (v && typeof v === 'object') v = `${v.min} - ${v.max}`
      lines.push(`${labels[f.k]}: ${v}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

async function submit(e) {
  e.preventDefault()
  const btn = $('submit-btn')
  const errBox = $('form-error')

  const { ok, firstBad } = commitStep()
  if (!ok) return flagStep(firstBad)

  btn.disabled = true
  btn.textContent = 'Sending…'

  if (isPreview) {
    console.info('[apply] preview mode — validated, nothing saved.', answers)
    $('done-lede').textContent = COPY[role].done
    show('done')
    btn.disabled = false
    btn.textContent = 'Send my application'
    return
  }

  // Store first. If the email step fails we still have the application.
  const { error: dbError } = await supabase.from('applications').insert({
    intake_role: role,
    email: answers.contact_email,
    answers,
  })

  if (dbError) {
    console.error('[apply] save failed', dbError)
    errBox.textContent =
      "We could not save that — please try again. If it keeps happening, email team@pairyx.co and we will take it from there."
    errBox.hidden = false
    btn.disabled = false
    btn.textContent = 'Send my application'
    return
  }

  // Then notify. A failure here is logged, not surfaced: the application is
  // already safe, and telling someone their submission failed when it did not
  // is worse than a delayed email.
  if (WEB3FORMS_KEY) {
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `New ${role} application — ${answers.company_name || answers.display_name || answers.contact_email}`,
          from_name: 'Pairyx intake',
          email: answers.contact_email,
          message: prettyBody(),
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

/* ────────────────────────────────── flow ─────────────────────────────── */

function startForm(r) {
  role = r
  step = 0
  answers = {}
  const u = new URL(window.location.href)
  u.searchParams.set('role', r)
  history.replaceState({}, '', u)

  const c = COPY[r]
  $('form-eyebrow').textContent = c.eyebrow
  $('form-title').textContent = c.title
  $('form-lede').textContent = c.lede
  renderStep()
  show('form')
}

/* ────────────────────────────────── wire up ─────────────────────────── */

$('intake-form').addEventListener('submit', submit)

$('next-btn').addEventListener('click', () => {
  const { ok, firstBad } = commitStep()
  if (!ok) return flagStep(firstBad)
  step++
  renderStep()
})

$('back-btn').addEventListener('click', () => {
  // Save whatever is on screen before leaving, without blocking on validation —
  // going back should never cost you your typing.
  for (const el of document.querySelectorAll('#form-fields .field')) {
    const r = readField(el)
    if (r.filled) answers[r.key] = r.value
  }
  if (step === 0) {
    role = null
    const u = new URL(window.location.href)
    u.searchParams.delete('role')
    history.replaceState({}, '', u)
    show('role')
    return
  }
  step--
  renderStep()
})

$('another-btn').addEventListener('click', () => {
  role = null
  answers = {}
  step = 0
  show('role')
})

for (const card of document.querySelectorAll('.rolecard')) {
  card.addEventListener('click', () => startForm(card.dataset.role))
}

/** Local-only form preview, so question edits can be checked without saving. */
const IS_LOCAL = ['localhost', '127.0.0.1', '::1'].includes(location.hostname)

;(function boot() {
  const params = new URL(window.location.href).searchParams
  const previewRole = params.get('preview')
  if (IS_LOCAL && (previewRole === 'brand' || previewRole === 'creator')) {
    isPreview = true
    startForm(previewRole)
    return
  }

  const wanted = params.get('role')
  if (wanted === 'brand' || wanted === 'creator') startForm(wanted)
  else show('role')
})()
