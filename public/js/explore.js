document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('explore-search');
  const resultGrid = document.getElementById('explore-results');
  const filterButtons = document.querySelectorAll('[data-filter]');
  let currentFilter = 'all';
  let scripts = [];

  async function loadScripts() {
    try {
      const response = await apiFetch('/api/explore');
      scripts = response.scripts || [];
      render();
    } catch (error) {
      resultGrid.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
  }

  function applyFilter(items) {
    const query = (searchInput?.value || '').toLowerCase();
    let filtered = items.filter((script) => {
      if (!query) return true;
      return [script.title, script.user?.username, script.tags.join(' ')].join(' ').toLowerCase().includes(query);
    });

    if (currentFilter === 'popular') {
      filtered = [...filtered].sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 9);
    }
    if (currentFilter === 'recent') {
      filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 9);
    }
    if (currentFilter === 'downloads') {
      filtered = [...filtered].sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    }

    return filtered;
  }

  function render() {
    const filtered = applyFilter(scripts);

    if (!filtered.length) {
      resultGrid.innerHTML = '<div class="empty-state">No public scripts match the current search.</div>';
      return;
    }

    resultGrid.innerHTML = filtered.map((script) => `
      <article class="script-card card">
        <div class="script-meta">
          <span>${script.user?.username || 'Unknown creator'}</span>
          <span>${new Date(script.createdAt).toLocaleDateString()}</span>
        </div>
        <h3>${script.title}</h3>
        <p>${script.description || 'No description provided.'}</p>
        <div class="tag-list">${(script.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join('') || '<span class="tag">lua</span>'}</div>
        <div class="card-footer">
          <span>${script.downloads || 0} downloads</span>
          <a href="/script-view.html?id=${script.id}" class="btn primary">View Script</a>
        </div>
      </article>
    `).join('');
  }

  searchInput.addEventListener('input', render);
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentFilter = button.dataset.filter;
      filterButtons.forEach((item) => item.classList.toggle('active', item === button));
      render();
    });
  });

  await loadScripts();
});
