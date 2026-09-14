const EMAIL_TO = process.env.CONTACT_EMAIL_TO || 'kozarezov@spaceevent.ru';
const RESEND_FROM = process.env.RESEND_FROM || 'SPACE Event <onboarding@resend.dev>';
const recentRequests = new Map();
// Per-instance protection; use an edge rule/shared store for global rate limits.
function allowRequest(req) {
  const now = Date.now();
  for (const [key, entry] of recentRequests) if (entry.until < now) recentRequests.delete(key);
  const ip = req.headers?.['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
  const entry = recentRequests.get(ip) || { count: 0, until: now + 600000 };
  if (entry.count >= 5) return false;
  entry.count++;
  if (recentRequests.size < 10000 || recentRequests.has(ip)) recentRequests.set(ip, entry);
  return true;
}

function clean(value, max = 2000) {
  return String(value || '').trim().slice(0, max);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[ch]));
}

async function sendEmail({ name, phone, message }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not configured');

  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(phone);
  const safeMessage = escapeHtml(message || '—').replace(/\n/g, '<br>');

  const response = await fetch('https://api.resend.com/emails', {
    signal: AbortSignal.timeout(12000),
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [EMAIL_TO],
      subject: `Новая заявка с сайта SPACE — ${name}`,
      html: `
        <h2>Новая заявка с сайта SPACE Event</h2>
        <p><strong>Имя:</strong> ${safeName}</p>
        <p><strong>Телефон:</strong> ${safePhone}</p>
        <p><strong>Сообщение:</strong><br>${safeMessage}</p>
      `,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend: ${response.status} ${text.slice(0, 300)}`);
  }
}

async function sendTelegram({ name, phone, message }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('Telegram is not configured');

  const text = [
    '<b>Новая заявка с сайта SPACE Event</b>',
    '',
    `<b>Имя:</b> ${escapeHtml(name)}`,
    `<b>Телефон:</b> ${escapeHtml(phone)}`,
    `<b>Сообщение:</b> ${escapeHtml(message || '—')}`,
  ].join('\n');

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    signal: AbortSignal.timeout(12000),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram: ${response.status} ${body.slice(0, 300)}`);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const name = clean(body.name, 80);
    const phone = clean(body.phone, 40);
    const message = clean(body.message, 2000);
    const contactExtraField = clean(body.contact_extra_field, 120);

    // Honeypot: use an uncommon field name to avoid browser/password-manager autofill.
    // Do not masquerade a blocked submission as success: return an explicit status.
    if (contactExtraField) {
      console.warn('Contact submission blocked by honeypot');
      return res.status(422).json({
        ok: false,
        error: 'spam_check_failed',
        channels: { telegram: false, email: false },
      });
    }

    if (name.length < 2 || phone.replace(/\D/g, '').length < 7) {
      return res.status(400).json({ ok: false, error: 'invalid_input' });
    }

    if (!allowRequest(req)) {
      res.setHeader('Retry-After', '600');
      return res.status(429).json({ ok: false, error: 'too_many_requests' });
    }

    const [emailResult, telegramResult] = await Promise.allSettled([
      sendEmail({ name, phone, message }),
      sendTelegram({ name, phone, message }),
    ]);

    const emailOk = emailResult.status === 'fulfilled';
    const telegramOk = telegramResult.status === 'fulfilled';

    if (!emailOk) {
      console.warn('Contact email delivery failed');
    }
    if (!telegramOk) {
      console.error('Contact Telegram delivery failed');
    }

    // A confirmed delivery through either configured channel is sufficient.
    if (!telegramOk && !emailOk) {
      return res.status(503).json({
        ok: false,
        error: 'delivery_failed',
        channels: { telegram: false, email: emailOk },
      });
    }

    return res.status(200).json({
      ok: true,
      channels: { telegram: telegramOk, email: emailOk },
    });
  } catch (error) {
    console.error('Contact handler error', error?.message || error);
    return res.status(500).json({ ok: false });
  }
};
