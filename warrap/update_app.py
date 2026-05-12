with open('static/js/app.js', 'r') as f:
    content = f.read()

funcs = '''// ── Bottom sheet drag ────────────────────────────────────────────────────────
function initBottomSheet() {
  const sheet = document.getElementById('bottom-sheet');
  if (!sheet) return;
  let expanded = false;
  
  const COLLAPSED = 'translateY(calc(100% - 180px))';
  const EXPANDED = 'translateY(0)';
  sheet.style.transform = COLLAPSED;
  sheet.style.transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)';

  document.getElementById('sheet-handle')?.addEventListener('click', () => {
    expanded = !expanded;
    sheet.style.transform = expanded ? EXPANDED : COLLAPSED;
  });
}

// ── Focus map on a task (called from task card / popup) ──────────────────────
function focusTask(id, lat, lng) {
  if (window.warrapMap) {
    window.warrapMap.flyTo([lat, lng], 16, { duration: 0.8 });
    // Highlight the card
    document.querySelectorAll('[data-task-id]').forEach(el => {
      el.classList.toggle('bg-canvas', el.dataset.taskId == id);
    });
    // Collapse bottom sheet to see map
    const sheet = document.getElementById('bottom-sheet');
    if (sheet) sheet.style.transform = 'translateY(calc(100% - 180px))';
  }
}

// ── Step form navigation ─────────────────────────────────────────────────────
function goToStep(n) {
  const steps = document.querySelectorAll('.form-step');
  const bars = document.querySelectorAll('[id^=" step-\][id$=\-bar\]');
