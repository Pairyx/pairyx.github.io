# Intake → spreadsheet

Every application from `pairyx.co/apply` lands in a Google Sheet, formatted
and ready to work from. Setting it up is a ten-minute job you do once.

The page keeps emailing submissions through Web3Forms as well. That is on
purpose: the email is the copy that cannot be lost, and the spreadsheet is the
copy you actually work in. If a sheet write ever fails, the applicant still
gets through and the row can be replayed from the email.

## Set it up

1. **Make the spreadsheet.** Go to [sheets.new](https://sheets.new) and name it
   something like `Pairyx — Intake`.

2. **Open the script editor.** In that spreadsheet: **Extensions → Apps Script**.
   It opens a project already bound to this sheet, which is what lets the script
   write to it with no API keys anywhere.

3. **Paste the code.** Delete whatever is in `Code.gs` and paste all of
   [`Code.gs`](Code.gs). Then **＋ → Script** next to *Files*, name the new file
   `schema`, and paste all of [`schema.gs`](schema.gs). Save.

4. **Build the sheets.** Run the `setup` function once (pick `setup` in the
   toolbar dropdown, press **Run**). Google asks for permission the first time —
   it is your own script writing to your own spreadsheet, so approve it. You may
   have to click *Advanced → Go to Pairyx (unsafe)*; that warning appears for
   every unpublished personal script.

   Go back to the spreadsheet. **Dashboard**, **Creators**, **Brands** and
   **Log** are there, formatted and empty.

5. **Deploy it as an endpoint.** In the script editor: **Deploy → New
   deployment → ⚙ → Web app**.
   - *Execute as*: **Me**
   - *Who has access*: **Anyone** ← required. The applicant's browser is
     anonymous; without this, every submission is rejected. "Anyone" lets
     people POST to the URL, not read your spreadsheet.

   Copy the **Web app URL**. It ends in `/exec`.

6. **Point the site at it.** In [`../apply/apply.js`](../apply/apply.js), put
   that URL in `SHEETS_ENDPOINT`, then commit and push. Until it is filled in,
   the form quietly works exactly as it did before — email only.

7. **Check it.** Open `pairyx.co/apply`, send yourself a test application, and
   watch a row appear. Delete the row afterwards; the dashboard follows.

## What you get

**Dashboard** — counts, the pipeline by stage, top categories on both sides,
median audience and rates, the last six weeks, and the ten most recent
applicants. All live formulas: change a Status by hand and every tile moves.

**Creators** and **Brands** — one row per application. Two header rows: the
dark band groups questions into the same sections the form uses, and the row
under it is the question itself, with its hint attached as a cell note. Frozen
so the date, status and name stay put while you scroll sideways through sixty
questions.

Columns we add around theirs:

| Column | |
|---|---|
| Received | when it landed |
| Status | New → Reviewing → Shortlisted → Matched → Passed, colour-coded |
| Owner | which of you has it |
| Fit | your 0–100 call, shaded red to green |
| Follow up | checkbox |
| Est. CPM | *creators only* — low-end rate ÷ average views × 1000, as a formula |
| Notes | |

Money reads as `$12,000`, audience counts as `480,000`, percentages as `6%`.
Follower counts, view counts and budgets carry a heat gradient so the outliers
find you. A missing contact email turns red.

**Log** — every submission, append-only, with the raw JSON. The safety net.

## Changing the questions

Edit [`../apply/forms.js`](../apply/forms.js) and push. That is the whole job —
each submission carries its own schema, so the sheet adds any new column on the
first application that answers it.

Columns are only ever added, never moved or deleted. Renaming a field key
therefore starts a fresh column rather than rewriting the old one's history.

Two optional extras:

- To have `setup()` know about new questions before anyone answers them, run
  `node sheets/build-schema.mjs` and paste the regenerated `schema.gs` back in.
- If you edit `Code.gs` itself, the change needs **Deploy → Manage deployments
  → ✏ → Version: New version** to reach the live URL. Saving alone does not.

## When something looks wrong

**Rows stop arriving.** Open the `/exec` URL in a browser — it should answer
`{"ok":true,...}`. If it asks you to sign in, *Who has access* is not set to
Anyone. Check **Executions** in the script editor for errors.

**A column is in the wrong place.** Run **Pairyx → Reapply formatting** from
the spreadsheet menu. It repaints headers and formats without touching rows.

**The dashboard shows `—` or `Nothing yet.`** It looks its tiles up by question
text. If a question was reworded, the tile that referenced the old wording
needs its header string updated in `buildDashboard_`.
