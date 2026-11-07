export function normalizeSocialLink(platform, value) {
  const target = String(value || '').trim();
  if (!target) return '';

  const usernamePattern = platform === 'instagram'
    ? /^[A-Za-z0-9._]{1,30}$/
    : /^[A-Za-z0-9_]+$/;
  const host = platform === 'instagram' ? 'instagram.com' : 't.me';
  const username = target.startsWith('@') ? target.slice(1) : target;

  if (usernamePattern.test(username)) return `https://${host}/${username}`;

  try {
    const url = new URL(target);
    const validHost = platform === 'instagram'
      ? ['instagram.com', 'www.instagram.com'].includes(url.hostname)
      : ['t.me', 'www.t.me'].includes(url.hostname);
    const validPath = platform === 'instagram'
      ? /^\/[A-Za-z0-9._]{1,30}\/?$/.test(url.pathname)
      : /^\/[A-Za-z0-9_]+\/?$/.test(url.pathname);

    return url.protocol === 'https:' && validHost && validPath ? url.href : '';
  } catch {
    return '';
  }
}
