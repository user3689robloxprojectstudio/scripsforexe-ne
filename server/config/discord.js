const crypto = require('crypto');

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const DISCORD_CALLBACK_URL = process.env.DISCORD_CALLBACK_URL || 'http://localhost:3000/auth/discord/callback';

function buildDiscordAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_CALLBACK_URL,
    response_type: 'code',
    scope: 'identify email',
    state
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

async function exchangeCodeForDiscordUser(code) {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    throw new Error('Discord OAuth credentials not configured.');
  }

  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: DISCORD_CALLBACK_URL
    })
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    throw new Error(`Discord token exchange failed: ${text}`);
  }

  const tokenData = await tokenResponse.json();
  const userResponse = await fetch('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`
    }
  });

  if (!userResponse.ok) {
    throw new Error('Unable to fetch Discord user data.');
  }

  const user = await userResponse.json();
  return {
    discordId: String(user.id),
    username: user.global_name || user.username,
    avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null
  };
}

function generateStateToken() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = {
  buildDiscordAuthUrl,
  exchangeCodeForDiscordUser,
  generateStateToken,
  DISCORD_CLIENT_ID,
  DISCORD_CALLBACK_URL
};
