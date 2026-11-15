document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const scriptId = params.get('id');

  if (!scriptId) {
    showToast('No script selected.', 'error');
    return;
  }

  try {
    const response = await apiFetch(`/api/scripts/${scriptId}`);
    const script = response.script;

    const editorTarget = document.getElementById('script-editor');
    const rawUrl = script.rawUrl || `${location.origin}/raw/${script.storageKey}`;
    document.getElementById('script-title').textContent = script.title;
    document.getElementById('script-owner').textContent = script.user?.username || 'Unknown';
    document.getElementById('script-visibility').textContent = script.visibility;
    document.getElementById('script-updated').textContent = new Date(script.updatedAt).toLocaleDateString();
    document.getElementById('script-downloads').textContent = String(script.downloads || 0);
    document.getElementById('script-description').textContent = script.description || 'No description provided.';
    document.getElementById('download-file-link').href = rawUrl;
    document.getElementById('download-file-link').download = `${script.filename || 'script.lua'}`;
    document.getElementById('copy-raw-btn').addEventListener('click', () => copyText(rawUrl));

    const responseCode = await fetch(rawUrl, { credentials: 'same-origin' });
    const codeText = await responseCode.text();

    if (window.require) {
      window.require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' } });
      window.require(['vs/editor/editor.main'], () => {
        const monaco = window.monaco;
        monaco.editor.create(editorTarget, {
          value: codeText || '',
          language: 'lua',
          theme: 'vs-dark',
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          wordWrap: 'on'
        });
      });
    } else {
      editorTarget.innerHTML = `<pre class="code-block">${escapeHtml(codeText || '')}</pre>`;
    }

    document.getElementById('copy-code-btn').addEventListener('click', () => copyText(codeText));
  } catch (error) {
    showToast(error.message, 'error');
    document.getElementById('script-title').textContent = 'Unavailable';
  }
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
