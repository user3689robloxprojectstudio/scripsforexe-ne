document.addEventListener('DOMContentLoaded', async () => {
  const user = await fetchCurrentUser();
  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const response = await apiFetch('/api/users/me');
    const currentUser = response.user;

    if (!currentUser) return;

    document.getElementById('account-avatar').src = currentUser.avatar || '/assets/logo.svg';
    document.getElementById('account-username').textContent = currentUser.username;
    document.getElementById('account-discord-id').textContent = `Discord ID: ${currentUser.discordId}`;
    document.getElementById('display-name').value = currentUser.username;
  } catch (error) {
    showToast(error.message, 'error');
  }

  const form = document.getElementById('settings-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('display-name').value.trim();
    if (!username) {
      showToast('Display name cannot be empty.', 'error');
      return;
    }

    try {
      const response = await apiFetch('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ username })
      });
      showToast('Settings saved.', 'success');
      document.getElementById('account-username').textContent = response.user.username;
      document.getElementById('account-discord-id').textContent = `Discord ID: ${response.user.discordId}`;
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  const deleteButton = document.getElementById('delete-account');
  deleteButton.addEventListener('click', async () => {
    const confirmed = window.confirm('Delete your account and all related uploads?');
    if (!confirmed) return;

    try {
      await apiFetch('/api/users/me', { method: 'DELETE' });
      window.location.href = '/index.html';
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
});
