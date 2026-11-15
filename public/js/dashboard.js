document.addEventListener('DOMContentLoaded', async () => {
  const user = await fetchCurrentUser();
  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  const userPill = document.getElementById('user-pill');
  if (userPill) {
    userPill.innerHTML = `
      <img src="${user.avatar || '/assets/logo.svg'}" alt="${user.username}" />
      <span>${user.username}</span>
    `;
  }

  const welcomeName = document.getElementById('welcome-name');
  if (welcomeName) {
    welcomeName.textContent = `Welcome back, ${user.username}`;
  }

  try {
    const response = await apiFetch('/api/scripts');
    const scripts = response.scripts || [];

    document.getElementById('stat-total').textContent = String(scripts.length);
    document.getElementById('stat-public').textContent = String(scripts.filter((script) => script.visibility === 'public').length);
    document.getElementById('stat-private').textContent = String(scripts.filter((script) => script.visibility === 'private').length);
    document.getElementById('stat-downloads').textContent = String(scripts.reduce((sum, script) => sum + (script.downloads || 0), 0));

    const recentBody = document.getElementById('recent-scripts-body');
    const recent = [...scripts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    if (!recent.length) {
      recentBody.innerHTML = '<tr><td colspan="5"><div class="empty-state">No scripts yet. Upload your first Lua script.</div></td></tr>';
      return;
    }

    recentBody.innerHTML = recent.map((script) => `
      <tr>
        <td><strong>${script.title}</strong></td>
        <td><span class="badge ${script.visibility}">${script.visibility}</span></td>
        <td>${new Date(script.createdAt).toLocaleDateString()}</td>
        <td>${script.downloads || 0}</td>
        <td>
          <div class="table-actions">
            <a href="/script-view.html?id=${script.id}">View</a>
            <button type="button" data-copy="${script.rawUrl}">Copy Raw</button>
          </div>
        </td>
      </tr>
    `).join('');

    recentBody.querySelectorAll('[data-copy]').forEach((button) => {
      button.addEventListener('click', () => copyText(button.getAttribute('data-copy')));
    });
  } catch (error) {
    showToast(error.message, 'error');
  }
});
