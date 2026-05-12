with open('static/js/app.js', 'r') as f:
    content = f.read()

# Make sure focusTask and others are properly included
new_js = '''
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
