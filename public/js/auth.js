document.addEventListener('DOMContentLoaded', async () => {
  const loginButton = document.getElementById('discord-login');

  if (loginButton) {
    loginButton.addEventListener('click', () => {
      window.location.href = '/auth/discord';
    });
  }

  const user = await fetchCurrentUser();
  if (user && window.location.pathname.endsWith('/login.html')) {
    window.location.href = '/dashboard.html';
  }
});
