/**
 * Pairyx intake → Google Sheets
 * ─────────────────────────────
 * A Web App endpoint that receives an /apply submission and appends it to a
 * formatted sheet. Paste this into an Apps Script project bound to the
 * spreadsheet, deploy it as a Web App, and put the resulting /exec URL into
 * SHEETS_ENDPOINT in apply/apply.js. See README.md for the click-by-click.
 *
 * WHY THE PAGE SENDS ITS OWN SCHEMA
 * The questions live in apply/forms.js and get edited often. If this script
 * carried its own copy of the column list, every question edit would need a
 * re-paste here, and the day someone forgot, answers would land in the wrong
 * column — silently, which is the worst way to lose data. So each submission
 * carries the schema that produced it, and the sheet reconciles its headers
 * against it on the way in. schema.gs holds a generated snapshot too, but only
 * so setup() can build a good-looking empty sheet before the first applicant
 * ever shows up.
 *
 * Columns are only ever ADDED, never moved or removed. A renamed field key
 * therefore shows up as a new column rather than overwriting the old one's
 * history — deliberately, since the alternative is destroying collected data
 * to satisfy a rename.
 */

/* ══════════════════════════════════════════════════════════════════════
   LOOK
   ══════════════════════════════════════════════════════════════════════ */

/** Straight from apply.css, so the sheet reads as the same product. */
var C = {
  navy:    '#071023',
  navy2:   '#13203c',  // alternate section band, so neighbours separate
  gold:    '#f9d38a',
  goldInk: '#6b4e12',
  goldBg:  '#fdf3e0',
  blue:    '#6e8bff',
  blueBg:  '#eceffd',
  greenBg: '#e3f6e9',
  greenInk:'#1d6b3a',
  mintBg:  '#cdeeda',
  mintInk: '#14532d',
  redBg:   '#fdeceb',
  redInk:  '#8c2f26',
  ink:     '#1b1d23',
  muted:   '#6e6e78',
  line:    '#d9dce4',
  labelBg: '#eef0f5',
  band:    '#f7f8fa',
  white:   '#ffffff',
}

var SHEETS = { creators: 'Creators', brands: 'Brands', log: 'Log', dash: 'Dashboard' }

/** Pipeline vocabulary. Order matters — it is the funnel, top to bottom. */
var STATUSES = ['New', 'Reviewing', 'Shortlisted', 'Matched', 'Passed', 'Archived']

var STATUS_COLORS = {
  New:         [C.goldBg,  C.goldInk],
  Reviewing:   [C.blueBg,  '#2c3f9e'],
  Shortlisted: [C.greenBg, C.greenInk],
  Matched:     [C.mintBg,  C.mintInk],
  Passed:      ['#eeeff2', C.muted],
  Archived:    ['#eeeff2', C.muted],
}

/** Columns we own, before the applicant's answers. */
var LEAD_OPS = [
  { k: '_received', label: 'Received',  type: 'datetime', w: 150 },
  { k: '_status',   label: 'Status',    type: 'status',   w: 130 },
]

/** Columns we own, after them. Working space for whoever reads the row. */
function tailOps(role) {
  var t = [
    { k: '_owner', label: 'Owner',     type: 'text',     w: 110 },
    { k: '_fit',   label: 'Fit',       type: 'score',    w: 70,
      note: 'Your call, 0–100. Colours itself.' },
    { k: '_flag',  label: 'Follow up', type: 'checkbox', w: 90 },
  ]
  if (role === 'creator') {
    t.push({ k: '_cpm', label: 'Est. CPM', type: 'currency2', w: 100,
      note: 'Low-end rate ÷ average views × 1000. Written as a formula, so it '
          + 'moves if you correct either number.' })
  }
  t.push({ k: '_notes', label: 'Notes', type: 'text', w: 420 })
  return t
}

/* ── per-field display rules ─────────────────────────────────────────────
   Money, counts and percentages all arrive as bare numbers, and a sheet full
   of bare numbers is unreadable. Keys are matched exactly where we can, and
   by suffix otherwise, so a new `rate_shorts` field formats itself. Order is
   load-bearing: `engagement_rate` is a percentage, not money, so percentages
   are tested first. */

var PERCENT_KEYS = ['audience_female_pct', 'geo_1_pct', 'engagement_rate',
                    'retention_pct', 'link_ctr']

var CURRENCY_KEYS = ['rate_min', 'rate_max', 'rate_dedicated', 'rate_integrated',
                     'rate_story', 'min_deal_size', 'budget_min', 'budget_max',
                     'per_creator_budget', 'price_point']

var COUNT_KEYS = ['primary_followers', 'youtube_subs', 'instagram_followers',
                  'tiktok_followers', 'newsletter_subs', 'avg_views',
                  'median_views', 'avg_comments']

function numericKind_(k) {
  if (PERCENT_KEYS.indexOf(k) >= 0 || /_pct$|_ctr$/.test(k)) return 'percent'
  if (CURRENCY_KEYS.indexOf(k) >= 0 || /^rate|_budget$|^budget_/.test(k)) return 'currency'
  if (COUNT_KEYS.indexOf(k) >= 0 || /_followers$|_subs$|_views$|_comments$/.test(k)) return 'count'
  return 'plain'
}

var FORMATS = {
  datetime:  'ddd d mmm  ·  h:mm am/pm',
  currency:  '"$"#,##0',
  currency2: '"$"#,##0.00',
  count:     '#,##0',
  percent:   '0.#"%"',
  plain:     '0.##',
  score:     '0',
}

/** Column width by field type. Long prose gets room without wrapping. */
var WIDTHS = {
  textarea: 380, text: 190, email: 230, url: 230, select: 170,
  radio: 130, checks: 300, number: 120, range: 130,
}

/* ══════════════════════════════════════════════════════════════════════
   ENDPOINT
   ══════════════════════════════════════════════════════════════════════ */

function doPost(e) {
  // Appends race each other the moment two people submit at once, and the
  // loser overwrites the winner. Serialise.
  var lock = LockService.getScriptLock()
  try { lock.waitLock(30000) } catch (err) { return reply_(false, 'busy') }

  try {
    var body = JSON.parse(e.postData.contents)
    if (!body || !body.role) return reply_(false, 'no role')

    var role = body.role === 'brand' ? 'brand' : 'creator'
    var schema = body.schema || []
    var display = body.display || {}

    // This URL is in the page source, so it is open by definition — a static
    // site has nowhere to keep a secret. Both forms make the contact email
    // required, so anything without one did not come from the form. It costs
    // nothing and turns away the laziest junk; Apps Script quotas handle the
    // rest. Anything determined enough to fake a submission could equally
    // well fill the form in.
    var email = String(display.contact_email || '')
    if (email.indexOf('@') < 1) return reply_(false, 'incomplete')

    var ss = SpreadsheetApp.getActive()
    var sheet = ensureSheet_(ss, role, schema)

    appendRow_(sheet, role, display)
    logRaw_(ss, role, display, body)
    try { buildDashboard_(ss) } catch (err) { /* a stale dashboard is not worth losing a row over */ }

    return reply_(true, 'saved')
  } catch (err) {
    // Never 500 at the applicant. The page treats a failure as non-fatal
    // because the Web3Forms email is the guaranteed copy, but there is no
    // reason to make them see an error either.
    console.error(err)
    return reply_(false, String(err))
  } finally {
    lock.releaseLock()
  }
}

/** Lets you open the /exec URL in a browser to check the thing is alive. */
function doGet() {
  return reply_(true, 'Pairyx intake endpoint is up. POST submissions here.')
}

function reply_(ok, message) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: ok, message: message }))
    .setMimeType(ContentService.MimeType.JSON)
}

/* ══════════════════════════════════════════════════════════════════════
   COLUMN MODEL
   ══════════════════════════════════════════════════════════════════════ */

/**
 * The full ordered column list for a role: our columns, then theirs.
 * A `range` question becomes two columns, since a low and a high in one cell
 * is a string you can never sort or sum.
 */
function columnsFor_(role, schema) {
  var cols = []

  LEAD_OPS.forEach(function (o) {
    cols.push({ k: o.k, label: o.label, type: o.type, section: 'Pairyx', w: o.w, note: o.note || '' })
  })

  ;(schema || []).forEach(function (group) {
    ;(group.fields || []).forEach(function (f) {
      if (f.type === 'range') {
        cols.push(fieldCol_(f, group.legend, f.k + '_min', f.label + ' — low'))
        cols.push(fieldCol_(f, group.legend, f.k + '_max', f.label + ' — high'))
      } else {
        cols.push(fieldCol_(f, group.legend, f.k, f.label))
      }
    })
  })

  tailOps(role).forEach(function (o) {
    cols.push({ k: o.k, label: o.label, type: o.type, section: 'Working notes', w: o.w, note: o.note || '' })
  })

  return cols
}

function fieldCol_(f, section, key, label) {
  var kind = (f.type === 'number' || f.type === 'range') ? numericKind_(key) : null
  return {
    k: key,
    label: label,
    type: kind && kind !== 'plain' ? kind : f.type,
    section: section || 'Answers',
    w: WIDTHS[f.type] || 190,
    note: f.hint || '',
    link: f.type === 'url',
  }
}

/* ── column bookkeeping ───────────────────────────────────────────────────
   Which key lives in which column is remembered in a hidden sheet rather
   than inferred from the header text, so that rewording a question does not
   strand a column. */

function metaSheet_(ss) {
  var s = ss.getSheetByName('_meta')
  if (!s) {
    s = ss.insertSheet('_meta')
    s.getRange('A1:B1').setValues([['sheet', 'columns (json) — do not edit by hand']])
    s.hideSheet()
  }
  return s
}

function metaGet_(ss, name) {
  var s = metaSheet_(ss)
  var rows = s.getDataRange().getValues()
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === name) { try { return JSON.parse(rows[i][1]) } catch (e) { return null } }
  }
  return null
}

function metaSet_(ss, name, cols) {
  var s = metaSheet_(ss)
  var rows = s.getDataRange().getValues()
  var json = JSON.stringify(cols)
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === name) { s.getRange(i + 1, 2).setValue(json); return }
  }
  s.appendRow([name, json])
}

/* ══════════════════════════════════════════════════════════════════════
   SHEET CONSTRUCTION
   ══════════════════════════════════════════════════════════════════════ */

function ensureSheet_(ss, role, schema) {
  var name = role === 'brand' ? SHEETS.brands : SHEETS.creators
  var sheet = ss.getSheetByName(name)
  var wanted = columnsFor_(role, schema)

  if (!sheet) {
    sheet = ss.insertSheet(name)
    writeSheet_(ss, sheet, role, wanted)
    return sheet
  }

  var have = metaGet_(ss, name)
  if (!have || !have.length) {          // sheet exists but we have never laid it out
    writeSheet_(ss, sheet, role, wanted)
    return sheet
  }

  // Reconcile: anything new goes on the end. Nothing already there moves.
  var known = {}
  have.forEach(function (c) { known[c.k] = true })
  var added = wanted.filter(function (c) { return !known[c.k] })
  if (added.length) {
    var merged = have.concat(added)
    writeSheet_(ss, sheet, role, merged)   // full repaint, cheap enough and keeps bands right
  }
  return sheet
}

/**
 * Paints the two header rows and every column-wide format. Data below row 2
 * is never touched — this runs on a live sheet.
 */
function writeSheet_(ss, sheet, role, cols) {
  var n = cols.length
  if (sheet.getMaxColumns() < n) sheet.insertColumnsAfter(sheet.getMaxColumns(), n - sheet.getMaxColumns())
  if (sheet.getMaxRows() < 400) sheet.insertRowsAfter(sheet.getMaxRows(), 400 - sheet.getMaxRows())

  // ── row 2: the questions
  sheet.getRange(2, 1, 1, n).setValues([cols.map(function (c) { return c.label })])
  var labelRow = sheet.getRange(2, 1, 1, n)
  labelRow
    .setBackground(C.labelBg)
    .setFontColor(C.navy)
    .setFontSize(10)
    .setFontWeight('bold')
    .setVerticalAlignment('middle')
    .setWrap(true)
    .setBorder(null, null, true, null, null, null, C.gold, SpreadsheetApp.BorderStyle.SOLID_MEDIUM)
  sheet.setRowHeight(2, 46)

  // The hint under each question becomes the cell note, so whoever reads a
  // column later knows what was actually asked.
  cols.forEach(function (c, i) {
    sheet.getRange(2, i + 1).setNote(c.note ? c.label + '\n\n' + c.note : c.label)
  })

  // ── row 1: section bands, merged across each run of same-section columns
  sheet.getRange(1, 1, 1, n).breakApart().clearContent().clearFormat()
  var start = 0, alt = 0
  for (var i = 1; i <= n; i++) {
    var here = cols[i - 1].section
    var next = i < n ? cols[i].section : null
    if (here === next) continue
    var span = sheet.getRange(1, start + 1, 1, i - start)
    if (i - start > 1) span.merge()
    var isOps = here === 'Pairyx' || here === 'Working notes'
    span.setValue(here.toUpperCase())
      .setBackground(isOps ? C.gold : (alt % 2 ? C.navy2 : C.navy))
      .setFontColor(isOps ? C.navy : C.gold)
      .setFontSize(9)
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
    if (!isOps) alt++
    start = i
  }
  sheet.setRowHeight(1, 30)

  // ── per column: width, number format, alignment
  cols.forEach(function (c, i) {
    var col = i + 1
    sheet.setColumnWidth(col, c.w || 190)
    var body = sheet.getRange(3, col, sheet.getMaxRows() - 2, 1)
    body.setFontSize(10).setFontColor(C.ink).setVerticalAlignment('middle')

    if (FORMATS[c.type]) body.setNumberFormat(FORMATS[c.type])

    if (c.type === 'datetime')      body.setHorizontalAlignment('left').setFontColor(C.muted)
    else if (c.type === 'currency' || c.type === 'currency2' ||
             c.type === 'count' || c.type === 'percent' || c.type === 'score')
      body.setHorizontalAlignment('right')
    else if (c.type === 'checkbox') body.setHorizontalAlignment('center')
    else                            body.setHorizontalAlignment('left')

    // Long prose is clipped rather than wrapped: sixty columns of wrapped
    // paragraphs is a sheet nobody can scan. Click the cell to read it.
    body.setWrap(false)
    if (c.type === 'textarea' || c.type === 'checks') body.setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
  })

  decorate_(sheet, cols)
  metaSet_(ss, sheet.getName(), cols)
  return sheet
}

/** Freeze, band, validate, colour. Everything that is not per-column. */
function decorate_(sheet, cols) {
  var n = cols.length
  var rows = sheet.getMaxRows() - 2

  sheet.setFrozenRows(2)
  sheet.setFrozenColumns(Math.min(4, n))   // date, status, and their name + first contact field
  sheet.setRowHeightsForced(3, rows, 24)
  sheet.getRange(1, 1, sheet.getMaxRows(), n).setFontFamily('Inter')

  // Zebra striping, subtle enough to read through.
  sheet.getBandings().forEach(function (b) { b.remove() })
  sheet.getRange(3, 1, rows, n)
    .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false)
    .setHeaderRowColor(null)
    .setFirstRowColor(C.white)
    .setSecondRowColor(C.band)

  var rules = []
  var idx = {}
  cols.forEach(function (c, i) { idx[c.k] = i + 1 })

  // Status: a dropdown, coloured per value.
  if (idx._status) {
    var statusRange = sheet.getRange(3, idx._status, rows, 1)
    statusRange.setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(STATUSES, true)
        .setAllowInvalid(false)
        .build()
    )
    statusRange.setHorizontalAlignment('center').setFontWeight('bold').setFontSize(9)
    STATUSES.forEach(function (s) {
      var pair = STATUS_COLORS[s]
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(s)
        .setBackground(pair[0]).setFontColor(pair[1])
        .setRanges([statusRange]).build())
    })
  }

  if (idx._flag) {
    sheet.getRange(3, idx._flag, rows, 1).insertCheckboxes()
  }

  // Fit score: a 0–100 gradient, so the good ones surface when you sort.
  if (idx._fit) {
    var fit = sheet.getRange(3, idx._fit, rows, 1)
    fit.setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireNumberBetween(0, 100)
        .setHelpText('0 to 100.')
        .setAllowInvalid(false).build()
    )
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .setGradientMaxpointWithValue(C.greenBg, SpreadsheetApp.InterpolationType.NUMBER, '100')
      .setGradientMidpointWithValue('#fff8e8', SpreadsheetApp.InterpolationType.NUMBER, '50')
      .setGradientMinpointWithValue(C.redBg, SpreadsheetApp.InterpolationType.NUMBER, '0')
      .setRanges([fit]).build())
  }

  // Heat on the numbers that actually drive a decision.
  ;['primary_followers', 'avg_views', 'median_views', 'engagement_rate',
    'retention_pct', 'budget_max', 'per_creator_budget'].forEach(function (k) {
    if (!idx[k]) return
    var r = sheet.getRange(3, idx[k], rows, 1)
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .setGradientMaxpointWithValue('#cfe4ff', SpreadsheetApp.InterpolationType.PERCENTILE, '90')
      .setGradientMinpointWithValue(C.white, SpreadsheetApp.InterpolationType.PERCENTILE, '10')
      .setRanges([r]).build())
  })

  // An empty required answer is a data problem worth seeing.
  ;['contact_email'].forEach(function (k) {
    if (!idx[k]) return
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenCellEmpty()
      .setBackground(C.redBg)
      .setRanges([sheet.getRange(3, idx[k], rows, 1)]).build())
  })

  sheet.setConditionalFormatRules(rules)
  sheet.getRange(1, 1, sheet.getMaxRows(), n)
    .setBorder(null, null, null, null, true, null, C.line, SpreadsheetApp.BorderStyle.SOLID)

  if (sheet.getMaxColumns() > n) sheet.hideColumns(n + 1, sheet.getMaxColumns() - n)
  sheet.getRange(3, 1, rows, n).createFilter && ensureFilter_(sheet, n, rows)
}

/** One filter view over the data, rebuilt only if missing. */
function ensureFilter_(sheet, n, rows) {
  var existing = sheet.getFilter()
  if (existing) existing.remove()
  sheet.getRange(2, 1, rows + 1, n).createFilter()
}

/* ══════════════════════════════════════════════════════════════════════
   WRITING A SUBMISSION
   ══════════════════════════════════════════════════════════════════════ */

function colLetter_(n) {
  var s = ''
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26 }
  return s
}

function appendRow_(sheet, role, display) {
  var ss = sheet.getParent()
  var cols = metaGet_(ss, sheet.getName()) || []
  var r = Math.max(sheet.getLastRow() + 1, 3)

  var idx = {}
  cols.forEach(function (c, i) { idx[c.k] = i + 1 })

  var row = cols.map(function (c) {
    if (c.k === '_received') return new Date()
    if (c.k === '_status')   return 'New'
    if (c.k === '_flag')     return false
    if (c.k === '_cpm' || c.k === '_owner' || c.k === '_fit' || c.k === '_notes') return ''
    var v = display[c.k]
    if (v === undefined || v === null) return ''
    // Numbers arrive as strings from a form. Store them as numbers or every
    // total, median and sort on this sheet is quietly wrong.
    if (c.type === 'currency' || c.type === 'currency2' || c.type === 'count' ||
        c.type === 'percent'  || c.type === 'number') {
      var num = Number(String(v).replace(/[^0-9.\-]/g, ''))
      return isNaN(num) ? v : num
    }
    return v
  })

  sheet.getRange(r, 1, 1, cols.length).setValues([row])

  // Est. CPM is a formula, not a snapshot, so correcting a rate fixes it too.
  if (idx._cpm && idx.rate_min && idx.avg_views) {
    sheet.getRange(r, idx._cpm).setFormula(
      '=IFERROR(ROUND(' + colLetter_(idx.rate_min) + r + '/(' +
      colLetter_(idx.avg_views) + r + '/1000),2),"")'
    )
  }

  // setValues does not linkify a URL the way typing one does.
  cols.forEach(function (c, i) {
    if (!c.link) return
    var v = row[i]
    if (typeof v === 'string' && /^https?:\/\//i.test(v)) {
      sheet.getRange(r, i + 1).setRichTextValue(
        SpreadsheetApp.newRichTextValue().setText(v).setLinkUrl(v).build()
      )
    }
  })
}

/**
 * An append-only copy of everything, in one uniform shape. If a formatting
 * pass ever goes wrong on a data sheet, the submissions are still here.
 */
function logRaw_(ss, role, display, body) {
  var s = ss.getSheetByName(SHEETS.log)
  if (!s) {
    s = ss.insertSheet(SHEETS.log)
    s.getRange(1, 1, 1, 6).setValues([['Received', 'Role', 'Name', 'Email', 'Answered', 'Payload']])
    s.getRange(1, 1, 1, 6)
      .setBackground(C.navy).setFontColor(C.gold).setFontWeight('bold').setFontSize(9)
    s.setFrozenRows(1)
    ;[150, 90, 220, 240, 90, 600].forEach(function (w, i) { s.setColumnWidth(i + 1, w) })
    s.getRange('A:A').setNumberFormat(FORMATS.datetime)
    s.getRange('F:F').setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP).setFontColor(C.muted).setFontSize(8)
  }
  s.appendRow([
    new Date(),
    role,
    display.display_name || display.company_name || '',
    display.contact_email || '',
    Object.keys(display).length,
    JSON.stringify(body.answers || display),
  ])
}

/* ══════════════════════════════════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════════════════════════════════
   Everything here is a live formula rather than a computed snapshot, so the
   numbers move when you change a Status by hand — which is the whole point
   of running the pipeline in the sheet instead of somewhere else.

   Columns are found by looking up the question text in row 2, so adding
   questions to the form never breaks a tile. */

/** A column of a data sheet, found by its header text. */
function colRef_(sheet, header) {
  return 'INDEX(' + sheet + "!$A:$CZ,0,MATCH(\"" + header + '",' + sheet + '!$2:$2,0))'
}

function buildDashboard_(ss) {
  var d = ss.getSheetByName(SHEETS.dash)
  if (!d) d = ss.insertSheet(SHEETS.dash, 0)
  d.clear()
  d.clearConditionalFormatRules()
  d.getBandings().forEach(function (b) { b.remove() })
  if (d.getMaxColumns() < 12) d.insertColumnsAfter(d.getMaxColumns(), 12 - d.getMaxColumns())

  var CR = SHEETS.creators, BR = SHEETS.brands
  var recvC = colRef_(CR, 'Received'), recvB = colRef_(BR, 'Received')
  var statC = colRef_(CR, 'Status'),  statB = colRef_(BR, 'Status')

  d.setHiddenGridlines(true)
  ;[40, 150, 110, 110, 150, 24, 150, 110, 110, 150].forEach(function (w, i) { d.setColumnWidth(i + 1, w) })

  // ── banner
  d.getRange('B2:J2').merge().setValue('PAIRYX')
    .setBackground(C.navy).setFontColor(C.gold).setFontWeight('bold')
    .setFontSize(13).setHorizontalAlignment('center').setVerticalAlignment('middle')
  d.setRowHeight(2, 38)
  d.getRange('B3:J3').merge()
    .setValue('Applications, live from pairyx.co/apply. Every number here recalculates as rows land and as you move people through the pipeline.')
    .setFontColor(C.muted).setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle')
  d.setRowHeight(3, 30)

  // ── KPI strip
  var kpis = [
    ['Creators',   '=IFERROR(COUNT(' + recvC + '),0)'],
    ['Brands',     '=IFERROR(COUNT(' + recvB + '),0)'],
    ['Unreviewed', '=IFERROR(COUNTIF(' + statC + ',"New")+COUNTIF(' + statB + ',"New"),0)'],
    ['This week',  '=IFERROR(COUNTIFS(' + recvC + ',">="&TODAY()-WEEKDAY(TODAY(),3))+COUNTIFS(' + recvB + ',">="&TODAY()-WEEKDAY(TODAY(),3)),0)'],
    ['Shortlisted','=IFERROR(COUNTIF(' + statC + ',"Shortlisted")+COUNTIF(' + statB + ',"Shortlisted"),0)'],
    ['Matched',    '=IFERROR(COUNTIF(' + statC + ',"Matched")+COUNTIF(' + statB + ',"Matched"),0)'],
  ]
  kpis.forEach(function (kpi, i) {
    var col = 2 + i + Math.floor(i / 6)
    d.getRange(5, col).setValue(kpi[0].toUpperCase())
      .setFontSize(8).setFontColor(C.muted).setFontWeight('bold').setHorizontalAlignment('center')
    d.getRange(6, col).setFormula(kpi[1])
      .setFontSize(26).setFontColor(C.navy).setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle')
      .setBackground(i === 2 ? C.goldBg : C.white)
      .setBorder(true, true, true, true, false, false, C.line, SpreadsheetApp.BorderStyle.SOLID)
  })
  d.setRowHeight(5, 20)
  d.setRowHeight(6, 58)

  // ── pipeline
  sectionTitle_(d, 8, 'PIPELINE')
  d.getRange(9, 2, 1, 4).setValues([['Stage', 'Creators', 'Brands', '']])
    .setFontSize(8).setFontColor(C.muted).setFontWeight('bold')
    .setBorder(null, null, true, null, null, null, C.line, SpreadsheetApp.BorderStyle.SOLID)
  STATUSES.forEach(function (s, i) {
    var r = 10 + i
    d.getRange(r, 2).setValue(s).setFontSize(10).setFontColor(C.ink)
    d.getRange(r, 3).setFormula('=IFERROR(COUNTIF(' + statC + ',"' + s + '"),0)')
      .setHorizontalAlignment('center').setFontWeight('bold')
    d.getRange(r, 4).setFormula('=IFERROR(COUNTIF(' + statB + ',"' + s + '"),0)')
      .setHorizontalAlignment('center').setFontWeight('bold')
    d.getRange(r, 5).setFormula('=REPT("▇",MIN(28,C' + r + '+D' + r + '))')
      .setFontColor(STATUS_COLORS[s][1]).setFontSize(9)
    d.setRowHeight(r, 22)
  })

  // ── what they are into
  sectionTitle_(d, 18, 'TOP CATEGORIES')
  d.getRange(19, 2).setValue('Creators').setFontSize(8).setFontColor(C.muted).setFontWeight('bold')
  d.getRange(19, 7).setValue('Brands').setFontSize(8).setFontColor(C.muted).setFontWeight('bold')
  d.getRange(20, 2).setFormula(topCats_(CR))
  d.getRange(20, 7).setFormula(topCats_(BR))
  d.getRange(20, 4).setFormula('=ARRAYFORMULA(IF(C20:C25="","",REPT("▇",MIN(20,C20:C25))))')
    .setFontColor(C.blue).setFontSize(9)
  d.getRange(20, 9).setFormula('=ARRAYFORMULA(IF(H20:H25="","",REPT("▇",MIN(20,H20:H25))))')
    .setFontColor(C.blue).setFontSize(9)

  // ── money and reach, the two numbers worth knowing at a glance
  sectionTitle_(d, 28, 'THE SHAPE OF THE PIPELINE')
  var stats = [
    ['Median creator audience', '=IFERROR(MEDIAN(' + colRef_(CR, 'Audience size on your main platform') + '),"—")', FORMATS.count],
    ['Median average views',    '=IFERROR(MEDIAN(' + colRef_(CR, 'Average views on a recent post') + '),"—")', FORMATS.count],
    ['Median creator rate (low)', '=IFERROR(MEDIAN(' + colRef_(CR, 'Your usual range for a brand deal (USD) — low') + '),"—")', FORMATS.currency],
    ['Median brand budget (high)', '=IFERROR(MEDIAN(' + colRef_(BR, 'Total budget for this (USD) — high') + '),"—")', FORMATS.currency],
    ['Total brand budget on the table', '=IFERROR(SUM(' + colRef_(BR, 'Total budget for this (USD) — high') + '),"—")', FORMATS.currency],
  ]
  stats.forEach(function (s, i) {
    var r = 29 + i
    d.getRange(r, 2, 1, 3).merge().setValue(s[0]).setFontSize(10).setFontColor(C.ink)
    d.getRange(r, 5).setFormula(s[1]).setNumberFormat(s[2])
      .setFontWeight('bold').setFontColor(C.navy).setHorizontalAlignment('right')
    d.getRange(r, 2, 1, 4).setBorder(null, null, true, null, null, null, '#eceef3', SpreadsheetApp.BorderStyle.SOLID)
    d.setRowHeight(r, 24)
  })

  // ── last six weeks
  sectionTitle_(d, 36, 'LAST SIX WEEKS')
  d.getRange(37, 2, 1, 4).setValues([['Week of', 'Creators', 'Brands', '']])
    .setFontSize(8).setFontColor(C.muted).setFontWeight('bold')
  for (var w = 0; w < 6; w++) {
    var r = 38 + w
    var from = 'TODAY()-WEEKDAY(TODAY(),3)-' + (7 * (5 - w))
    var to   = 'TODAY()-WEEKDAY(TODAY(),3)-' + (7 * (5 - w) - 6)
    d.getRange(r, 2).setFormula('=' + from).setNumberFormat('d mmm').setFontColor(C.muted).setFontSize(10)
    d.getRange(r, 3).setFormula('=IFERROR(COUNTIFS(' + recvC + ',">="&' + from + ',' + recvC + ',"<="&' + to + '+1),0)')
      .setHorizontalAlignment('center')
    d.getRange(r, 4).setFormula('=IFERROR(COUNTIFS(' + recvB + ',">="&' + from + ',' + recvB + ',"<="&' + to + '+1),0)')
      .setHorizontalAlignment('center')
    d.getRange(r, 5).setFormula('=REPT("▇",MIN(28,C' + r + '+D' + r + '))').setFontColor(C.gold).setFontSize(9)
    d.setRowHeight(r, 22)
  }

  // ── latest activity, straight off the log
  sectionTitle_(d, 46, 'LATEST')
  d.getRange(47, 2).setFormula(
    '=IFERROR(QUERY(' + SHEETS.log + "!A:D,\"select A,B,C,D where A is not null order by A desc limit 10 label A 'When', B 'Side', C 'Who', D 'Email'\",1),\"Nothing yet.\")"
  )
  d.getRange(47, 2, 1, 4).setFontSize(8).setFontColor(C.muted).setFontWeight('bold')
  d.getRange(48, 2, 10, 1).setNumberFormat(FORMATS.datetime)

  d.getRange('A:A').setBackground(C.white)
  d.setFrozenRows(3)
  d.getRange(1, 1, d.getMaxRows(), d.getMaxColumns()).setFontFamily('Inter')
  return d
}

function topCats_(sheetName) {
  return '=IFERROR(QUERY(' + colRef_(sheetName, 'Closest category') +
    ',"select Col1, count(Col1) where Col1 is not null group by Col1 ' +
    'order by count(Col1) desc limit 6 label count(Col1) \'\'",2),"Nothing yet.")'
}

function sectionTitle_(d, row, text) {
  d.getRange(row, 2, 1, 9).merge().setValue(text)
    .setBackground(C.navy).setFontColor(C.gold).setFontWeight('bold').setFontSize(9)
    .setVerticalAlignment('middle').setHorizontalAlignment('left')
  d.setRowHeight(row, 26)
}

/* ══════════════════════════════════════════════════════════════════════
   MENU
   ══════════════════════════════════════════════════════════════════════ */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Pairyx')
    .addItem('Set up / rebuild everything', 'setup')
    .addItem('Rebuild dashboard', 'menuDashboard')
    .addItem('Reapply formatting', 'menuReformat')
    .addToUi()
}

/**
 * Builds both sheets and the dashboard from the schema snapshot in schema.gs,
 * so the spreadsheet looks finished before the first application arrives.
 * Safe to re-run: headers and formats are repainted, rows are left alone.
 */
function setup() {
  var ss = SpreadsheetApp.getActive()
  ensureSheet_(ss, 'creator', SCHEMA.creator)
  ensureSheet_(ss, 'brand', SCHEMA.brand)
  logRaw_(ss, 'setup', {}, { answers: {} })
  var log = ss.getSheetByName(SHEETS.log)
  if (log.getLastRow() > 1) log.deleteRow(log.getLastRow())   // drop the probe row
  buildDashboard_(ss)
  ss.setActiveSheet(ss.getSheetByName(SHEETS.dash))
  SpreadsheetApp.getActive().toast('Sheets built.', 'Pairyx', 5)
}

function menuDashboard() { buildDashboard_(SpreadsheetApp.getActive()); SpreadsheetApp.getActive().toast('Dashboard rebuilt.', 'Pairyx', 5) }

function menuReformat() {
  var ss = SpreadsheetApp.getActive()
  ;[['creator', SHEETS.creators], ['brand', SHEETS.brands]].forEach(function (pair) {
    var sheet = ss.getSheetByName(pair[1])
    if (!sheet) return
    var cols = metaGet_(ss, pair[1])
    if (cols && cols.length) writeSheet_(ss, sheet, pair[0], cols)
  })
  ss.toast('Formatting reapplied.', 'Pairyx', 5)
}
