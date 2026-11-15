document.addEventListener('DOMContentLoaded', async () => {
  const user = await fetchCurrentUser();
  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  const searchInput = document.getElementById('script-search');
  let scripts = [];

  async function loadScripts() {
    try {
      const response = await apiFetch('/api/scripts');
      scripts = response.scripts || [];
      renderScripts(scripts);
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  function renderScripts(items) {
    const tableBody = document.getElementById('scripts-table-body');
    if (!items.length) {
      tableBody.innerHTML = '<tr><td colspan="6"><div class="empty-state">You do not have any scripts yet.</div></td></tr>';
      return;
    }

    const filtered = items.filter((script) => {
      const query = (searchInput?.value || '').toLowerCase();
      if (!query) return true;
      return [script.title, script.filename, script.tags.join(' '), script.visibility].join(' ').toLowerCase().includes(query);
    });

    tableBody.innerHTML = filtered.map((script) => `
      <tr>
        <td>
          <strong>${script.title}</strong>
          <div class="muted">${script.filename}</div>
        </td>
        <td>${(script.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join('') || '<span class="muted">No tags</span>'}</td>
        <td><span class="badge ${script.visibility}">${script.visibility}</span></td>
        <td>${new Date(script.updatedAt).toLocaleDateString()}</td>
        <td>${script.downloads || 0}</td>
        <td>
          <div class="table-actions">
            <a href="/script-view.html?id=${script.id}">View</a>
            <button type="button" data-copy="${script.rawUrl}">Copy Raw</button>
            <button type="button" data-toggle="${script.id}" data-visibility="${script.visibility}">${script.visibility === 'public' ? 'Private' : 'Public'}</button>
            <button type="button" data-delete="${script.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    tableBody.querySelectorAll('[data-copy]').forEach((button) => {
      button.addEventListener('click', () => copyText(button.getAttribute('data-copy')));
    });

    tableBody.querySelectorAll('[data-delete]').forEach((button) => {
      button.addEventListener('click', async () => {
        const scriptId = button.getAttribute('data-delete');
        const confirmed = window.confirm('Delete this script? This action cannot be undone.');
        if (!confirmed) return;

        try {
          await apiFetch(`/api/scripts/${scriptId}`, { method: 'DELETE' });
          showToast('Script deleted.', 'success');
          await loadScripts();
        } catch (error) {
          showToast(error.message, 'error');
        }
      });
    });

    tableBody.querySelectorAll('[data-toggle]').forEach((button) => {
      button.addEventListener('click', async () => {
        const scriptId = button.getAttribute('data-toggle');
        const next = button.getAttribute('data-visibility') === 'public' ? 'private' : 'public';
        try {
          await apiFetch(`/api/scripts/${scriptId}`, {
            method: 'PATCH',
            body: JSON.stringify({ visibility: next })
          });
          showToast(`Visibility changed to ${next}.`, 'success');
          await loadScripts();
        } catch (error) {
          showToast(error.message, 'error');
        }
      });
    });
  }

  searchInput.addEventListener('input', () => renderScripts(scripts));
  await loadScripts();
});
