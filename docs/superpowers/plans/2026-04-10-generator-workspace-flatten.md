# Generator Workspace Flatten Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the Skill Generator page to a true single-column workbench that only shows the template picker, stepper, form, sticky action bar, and modal preview.

**Architecture:** Remove the hero and side-rail shells from the generator DOM instead of hiding them, then let the generator container render as a single primary panel. Keep generator state, preview modal, and action flow intact so behavior changes are structural and visual rather than functional.

**Tech Stack:** Static HTML/CSS, vanilla client-side JavaScript, Node test runner, Playwright-based UI tests.

---

### Task 1: Update UI tests to describe the flattened workbench

**Files:**
- Modify: `tests/skill-generator-ui.test.js`

- [ ] **Step 1: Rewrite the failing expectations for the first-screen generator layout**

Replace the old cockpit assertions so the tests expect a single workbench and missing outer shells:

```js
  assert.equal(await page.locator('#generator-view').isVisible(), true);
  assert.equal(await page.locator('#library-view').isHidden(), true);
  assert.equal(await page.locator('#view-tabs').isHidden(), true);
  assert.equal(await page.locator('#generator-hero').count(), 0);
  assert.equal(await page.locator('#generator-insight-panel').count(), 0);
  assert.equal(await page.locator('#generator-preview-card').count(), 0);
  assert.equal(await page.locator('.generator-input-panel').isVisible(), true);
```

- [ ] **Step 2: Replace spacing checks with single-column workbench checks**

Use a structural assertion that the input panel spans the generator layout and no ghost rails remain:

```js
  const layout = await page.evaluate(() => {
    const shell = document.querySelector('#generator-view');
    const panel = document.querySelector('.generator-input-panel');
    const panelStyle = window.getComputedStyle(panel);
    return {
      shellWidth: Math.round(shell.getBoundingClientRect().width),
      panelWidth: Math.round(panel.getBoundingClientRect().width),
      panelColumns: panelStyle.gridColumn,
      panelDisplay: panelStyle.display
    };
  });
```

- [ ] **Step 3: Run the focused UI tests and confirm they fail for the old cockpit layout**

Run: `npm test -- --test-only tests/skill-generator-ui.test.js`

Expected: FAIL on assertions that still expect `#generator-hero`, `#generator-insight-panel`, or `#generator-preview-card`.

---

### Task 2: Remove the extra generator shell DOM and flatten the layout

**Files:**
- Modify: `public/index.html`

- [ ] **Step 1: Replace the generator shell markup with a single primary panel**

Delete the `#generator-hero`, `#generator-insight-panel`, and `#generator-preview-card` blocks and keep only:

```html
<section class="generator-shell" id="generator-view">
  <div class="generator-layout generator-layout-single">
    <section class="panel generator-panel generator-input-panel">
      ...
    </section>
  </div>

  <div class="generator-toolbar">
    <button class="small-btn" id="generator-reset-btn" data-action="reset-generator" type="button">重置</button>
    <button class="small-btn" id="generator-prev-btn" type="button" hidden>上一步</button>
    <button class="primary-btn" id="generator-preview-btn" data-action="next-generator-step" type="button">下一步</button>
  </div>
```

- [ ] **Step 2: Shorten the workbench copy inside the remaining panel**

Use compact, workbench-first copy in the retained header:

```html
<div class="section-title" id="generator-panel-eyebrow">Skill 生成器</div>
<h2 id="generator-panel-title">填写工作区</h2>
<p class="skill-subtitle" id="generator-panel-subtitle">直接填写模板、步骤和表单内容，最后生成并发送给 OpenClaw。</p>
```

- [ ] **Step 3: Remove dead CSS blocks tied to the deleted shell**

Delete or stop using the CSS groups for:

```css
.generator-hero { ... }
.generator-ready-card { ... }
.generator-side-panel { ... }
.generator-current-step { ... }
.generator-preview-summary { ... }
.generator-metric-grid { ... }
```

and add single-column layout rules such as:

```css
.generator-layout {
  display: block;
}

.generator-layout-single .generator-input-panel {
  width: 100%;
  max-width: none;
}
```

---

### Task 3: Trim JS copy/rendering to match the flat workbench

**Files:**
- Modify: `public/app.js`

- [ ] **Step 1: Simplify static copy to target only the retained workbench elements**

Keep the generator panel text updates and remove reliance on deleted shell copy:

```js
  setText('#generator-panel-eyebrow', translate('generator.title'));
  setText('#generator-panel-title', state.locale === 'en' ? 'Workspace' : '填写工作区');
  setText(
    '#generator-panel-subtitle',
    state.locale === 'en'
      ? 'Fill the template, steps, and form fields directly, then generate the final Skill prompt.'
      : '直接填写模板、步骤和表单内容，最后生成并发送给 OpenClaw。'
  );
```

- [ ] **Step 2: Remove cockpit-only rendering work**

Delete the summary/metric building that only fed the removed side rails. Leave only action-status rendering where it still affects modal or screen-reader feedback.

- [ ] **Step 3: Re-run the focused UI tests**

Run: `npm test -- --test-only tests/skill-generator-ui.test.js`

Expected: PASS for the updated generator layout assertions.

---

### Task 4: Full verification, version bump, and release push

**Files:**
- Modify: `package.json`
- Modify: `README.md` if release wording needs to reflect the workspace-only page

- [ ] **Step 1: Bump the app version for the new release**

Update:

```json
"version": "0.1.1"
```

- [ ] **Step 2: Run the full verification commands**

Run:
- `npm test`
- `npm run smoke`

Expected:
- `npm test` exits `0`
- `npm run smoke` exits `0`

- [ ] **Step 3: Commit and push the release**

Run:

```bash
git add public/index.html public/app.js tests/skill-generator-ui.test.js package.json docs/superpowers/plans/2026-04-10-generator-workspace-flatten.md
git commit -m "feat: flatten generator into single workbench"
git push origin main
```
