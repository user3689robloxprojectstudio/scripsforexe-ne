async function apiFetch(url, options = {}) {
  const defaultHeaders = {};
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(typeof payload === 'object' ? (payload.error || 'Request failed.') : payload || 'Request failed.');
  }

  return payload;
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast show';
  toast.style.borderColor = type === 'error' ? 'rgba(239,68,68,0.7)' : 'rgba(34,197,94,0.7)';
  setTimeout(() => toast.classList.remove('show'), 2500);
}

async function fetchCurrentUser() {
  try {
    const response = await apiFetch('/api/auth/me');
    return response.authenticated ? response.user : null;
  } catch (error) {
    return null;
  }
}

function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function copyText(value) {
  if (!value) return;
  navigator.clipboard.writeText(value).then(() => showToast('Copied to clipboard.', 'success')).catch(() => showToast('Clipboard access failed.', 'error'));
}

function setActiveNav() {
  const path = window.location.pathname;
  const links = document.querySelectorAll('[data-nav]');
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if ((path.endsWith(href) && href !== '/') || (href === '/' && path === '/')) {
      link.classList.add('active');
    }
  });
}

function bindLogoutButtons() {
  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await apiFetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/index.html';
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bindLogoutButtons();
  setActiveNav();
  if (!document.getElementById('toast')) {
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
});
