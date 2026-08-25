/**
 * Pairyx — /apply
 *
 * Sign-in (Supabase email + password, on this page) + a multi-step client
 * intake form.
 *
 * This runs on GitHub Pages, which serves static files only — there is no
 * server of ours in the request path. That shapes two things:
 *
 *   1. Auth is Supabase's hosted auth, called from the browser. The anon key
 *      below is PUBLIC by design; row-level security in Postgres is what
 *      actually protects the data, not the secrecy of this key. Email only
 *      leaves this page for account confirmation and password reset — normal
 *      sign-in never requires leaving the form.
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
const WEB3FORMS_KEY = ''

/* ══════════════════════════════════════════════════════════════════════ */

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

const $ = (id) => document.getElementById(id)
const views = ['loading', 'signin', 'reset', 'sent', 'role', 'form', 'done']
function show(name) {
  for (const v of views) $(`view-${v}`).hidden = v !== name
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

let session = null
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
    `Account email: ${session.user.email}`,
    `Submitted:     ${new Date().toLocaleString()}`,
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

  if (!session) {
    errBox.textContent = 'Your sign-in expired. Please sign in again — nothing you typed is lost.'
    errBox.hidden = false
    return
  }

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
    user_id: session.user.id,
    intake_role: role,
    email: answers.contact_email || session.user.email,
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
          subject: `New ${role} application — ${answers.company_name || answers.display_name || session.user.email}`,
          from_name: 'Pairyx intake',
          email: answers.contact_email || session.user.email,
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

/* ────────────────────────────────── auth ────────────────────────────── */

let authMode = 'signin'

function setAuthMode(mode) {
  authMode = mode
  $('tab-signin').classList.toggle('active', mode === 'signin')
  $('tab-signup').classList.toggle('active', mode === 'signup')
  $('signin-title').textContent = mode === 'signin' ? 'Sign in' : 'Create your account'
  $('signin-lede').textContent =
    mode === 'signin'
      ? 'Sign in to continue your application.'
      : 'Set a password and you are in — no email link needed.'
  $('signin-btn').textContent = mode === 'signin' ? 'Sign in' : 'Create account'
  $('signin-password').autocomplete = mode === 'signin' ? 'current-password' : 'new-password'
  $('signin-error').hidden = true
}

async function submitAuth(e) {
  e.preventDefault()
  const email = $('signin-email').value.trim()
  const password = $('signin-password').value
  const btn = $('signin-btn')
  const errBox = $('signin-error')
  errBox.hidden = true

  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
    errBox.textContent = "That does not look like an email address."
    errBox.hidden = false
    return
  }
  if (password.length < 8) {
    errBox.textContent = "Password needs to be at least 8 characters."
    errBox.hidden = false
    return
  }

  btn.disabled = true
  btn.textContent = authMode === 'signin' ? 'Signing in…' : 'Creating account…'

  if (authMode === 'signin') {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    btn.disabled = false
    btn.textContent = 'Sign in'
    if (error) {
      errBox.textContent = /invalid login credentials/i.test(error.message)
        ? 'Email or password is wrong. New here? Use "Create account" instead.'
        : error.message
      errBox.hidden = false
    }
    // Success routes via onAuthStateChange.
    return
  }

  const url = new URL(window.location.href)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: url.origin + url.pathname + (role ? `?role=${role}` : '') },
  })
  btn.disabled = false
  btn.textContent = 'Create account'

  if (error) {
    errBox.textContent = /already registered|user already exists/i.test(error.message)
      ? 'That email already has an account. Try signing in instead.'
      : error.message
    errBox.hidden = false
    return
  }

  if (data.session) return // Confirmations off for this project — routes via onAuthStateChange.

  $('sent-title').textContent = 'Confirm your email.'
  $('sent-message').textContent =
    `We sent a confirmation link to ${email}. Open it on this device and you'll land straight back here, signed in.`
  show('sent')
}

async function requestPasswordReset() {
  const email = $('signin-email').value.trim()
  const errBox = $('signin-error')
  errBox.hidden = true

  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
    errBox.textContent = 'Enter your email above first, then click "Forgot password?".'
    errBox.hidden = false
    return
  }

  const url = new URL(window.location.href)
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: url.origin + url.pathname + (role ? `?role=${role}` : ''),
  })

  if (error) {
    errBox.textContent = error.message
    errBox.hidden = false
    return
  }

  $('sent-title').textContent = 'Reset link sent.'
  $('sent-message').textContent = `We emailed a password reset link to ${email}.`
  show('sent')
}

async function submitNewPassword(e) {
  e.preventDefault()
  const password = $('reset-password').value
  const btn = $('reset-btn')
  const errBox = $('reset-error')
  errBox.hidden = true

  if (password.length < 8) {
    errBox.textContent = 'Password needs to be at least 8 characters.'
    errBox.hidden = false
    return
  }

  btn.disabled = true
  btn.textContent = 'Updating…'
  const { error } = await supabase.auth.updateUser({ password })
  btn.disabled = false
  btn.textContent = 'Update password'

  if (error) {
    errBox.textContent = error.message
    errBox.hidden = false
    return
  }

  routeSignedIn()
}

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

function routeSignedIn() {
  $('px-navcta').hidden = false
  const wanted = new URL(window.location.href).searchParams.get('role')
  if (wanted === 'brand' || wanted === 'creator') startForm(wanted)
  else show('role')
}

/* ────────────────────────────────── wire up ─────────────────────────── */

$('tab-signin').addEventListener('click', () => setAuthMode('signin'))
$('tab-signup').addEventListener('click', () => setAuthMode('signup'))
$('signin-form').addEventListener('submit', submitAuth)
$('forgot-btn').addEventListener('click', requestPasswordReset)
$('reset-form').addEventListener('submit', submitNewPassword)
$('sent-again').addEventListener('click', () => show('signin'))
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

$('px-navcta').addEventListener('click', async () => {
  await supabase.auth.signOut()
  window.location.href = window.location.pathname
})

supabase.auth.onAuthStateChange((event, s) => {
  if (isPreview) return
  // A reset-password link lands here with a live session in recovery mode.
  // Route to "set a new password" instead of straight into the form.
  if (event === 'PASSWORD_RECOVERY') {
    session = s
    show('reset')
    return
  }
  if (s) {
    session = s
    routeSignedIn()
    return
  }
  // Null means signed out or a failed refresh. Dropping back to sign-in beats
  // leaving a dead form on screen that only fails at submit.
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESH_FAILED') {
    session = null
    $('px-navcta').hidden = true
    show('signin')
  }
})

/** Local-only form preview, so question edits can be checked without email. */
const IS_LOCAL = ['localhost', '127.0.0.1', '::1'].includes(location.hostname)

;(async function boot() {
  const previewRole = new URL(window.location.href).searchParams.get('preview')
  if (IS_LOCAL && (previewRole === 'brand' || previewRole === 'creator')) {
    isPreview = true
    session = { user: { id: 'preview', email: 'preview@localhost' } }
    startForm(previewRole)
    return
  }

  const { data } = await supabase.auth.getSession()
  session = data.session
  if (session) routeSignedIn()
  else {
    const wanted = new URL(window.location.href).searchParams.get('role')
    if (wanted === 'brand' || wanted === 'creator') role = wanted
    show('signin')
  }
})()
