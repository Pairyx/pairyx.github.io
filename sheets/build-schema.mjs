/**
 * Generates schema.gs from apply/forms.js.
 *
 * The Apps Script only needs this snapshot for setup() — building a
 * good-looking empty spreadsheet before anyone has applied. Live submissions
 * carry their own schema, so a stale snapshot cannot misfile an answer; the
 * worst it does is leave a brand-new question out of an empty sheet until the
 * first person answers it.
 *
 *   node sheets/build-schema.mjs
 *
 * Run it after editing questions, then paste schema.gs into the Apps Script
 * project again if you want setup() to know about the change.
 */

import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))

// forms.js is ESM but sits in a directory with no package.json, so node would
// read it as CommonJS. Hand it a .mjs copy instead.
const shim = join(tmpdir(), `pairyx-forms-${process.pid}.mjs`)
writeFileSync(shim, readFileSync(join(here, '..', 'apply', 'forms.js'), 'utf8'))

const { CREATOR_FORM, BRAND_FORM } = await import(`file://${shim}`)
unlinkSync(shim)

/** Only what the sheet builder reads. Options stay behind — the page sends
    display labels, so the spreadsheet never sees a raw enum value. */
const trim = (form) =>
  form.map(({ legend, fields }) => ({
    legend,
    fields: fields.map(({ k, label, type, hint }) =>
      hint ? { k, label, type, hint } : { k, label, type }),
  }))

const schema = { creator: trim(CREATOR_FORM), brand: trim(BRAND_FORM) }

const out = `/**
 * GENERATED FILE — do not edit.
 * Produced by sheets/build-schema.mjs from apply/forms.js.
 * Regenerate with:  node sheets/build-schema.mjs
 *
 * Used only by setup(). Live submissions carry their own schema.
 */

var SCHEMA = ${JSON.stringify(schema, null, 2)}
`

writeFileSync(join(here, 'schema.gs'), out)

const count = (f) => f.reduce((n, g) => n + g.fields.length, 0)
console.log(
  `schema.gs written — creator: ${schema.creator.length} steps / ${count(schema.creator)} questions, ` +
  `brand: ${schema.brand.length} steps / ${count(schema.brand)} questions`
)
