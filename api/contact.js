// Vercel serverless function — contact / lead notification.
// Accepts POST JSON from the homepage "Schedule a Demo" form and the
// free Brand Kit lead form. Sends a notification email to the business
// inbox via Resend, with reply-to set to the submitter so the team can
// reply directly to the lead. Best-effort adds the lead to the Resend
// Audience. Uses native fetch (Node 18+) — no npm dependencies.
//
// Required env vars:
//   RESEND_API_KEY     — Resend API key (required for email sending)
//   RESEND_AUDIENCE_ID — Resend Audience UUID (optional; stores the lead)
//   CONTACT_TO         — destination inbox (optional; defaults below)
//
// Without RESEND_API_KEY this returns a 500 and the form shows its
// inline error — it never reports a false success.

// Notification-only sender. reply_to is set to the lead's email below,
// so the team can still reply directly to the lead from this address.
const FROM_ADDRESS = 'SICUS Media <noreply@sicusmedia.com>';
// Both the shared marketing inbox and the salesperson who actually makes the
// call back. CONTACT_TO overrides the whole list (comma-separated).
const TO_ADDRESSES = (process.env.CONTACT_TO || 'marketingsicusmedia@gmail.com,tonycuong.ca@gmail.com')
  .split(',')
  .map((a) => a.trim())
  .filter(Boolean);

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rowsHtml(fields) {
  return fields
    .filter(function (f) { return f.value != null && String(f.value).trim() !== ''; })
    .map(function (f) {
      return `<tr>
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;white-space:nowrap;vertical-align:top;border-bottom:1px solid #f0f0f0;background:#fafafa;">${esc(f.label)}</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;border-bottom:1px solid #f0f0f0;">${esc(f.value).replace(/\n/g, '<br>')}</td>
      </tr>`;
    })
    .join('');
}

function emailHtml(heading, fields) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="padding:28px 40px 20px 40px;border-bottom:3px solid #8CB82B;">
          <img src="https://sicusmedia.com/brand_assets/topbar.png" alt="SICUS MEDIA" height="32" style="display:block;">
        </td></tr>
        <tr><td style="padding:28px 40px 4px 40px;">
          <h1 style="margin:0 0 6px 0;font-size:20px;line-height:1.3;color:#111827;font-weight:700;letter-spacing:-0.02em;">${esc(heading)}</h1>
          <p style="margin:0;font-size:13px;color:#9ca3af;">Reply to this email to respond directly to the lead.</p>
        </td></tr>
        <tr><td style="padding:20px 24px 28px 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #f0f0f0;border-radius:10px;overflow:hidden;">
            ${rowsHtml(fields)}
          </table>
        </td></tr>
        <tr><td style="padding:18px 40px;background:#fafafa;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;text-align:center;">Sent from the sicusmedia.com contact form.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Best-effort: add the lead to a Resend Audience. Non-blocking — logs
 * errors but never throws. Notifying the team is the primary goal.
 */
async function addToAudience(apiKey, audienceId, email, firstName, lastName) {
  if (!audienceId) return; // graceful skip if not configured
  try {
    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        first_name: firstName || '',
        last_name: lastName || '',
        unsubscribed: false,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      // 409 "already exists" is expected for returning leads — not an error
      if (res.status === 409 || /already exists/i.test(errText)) return;
      console.error('Resend Audiences API error:', res.status, errText);
    }
  } catch (err) {
    console.error('Unexpected error adding contact to audience:', err);
  }
}

// Records the lead in the app (sicus-media) so the nurture sequence has a row
// to run against. Best-effort by design: this endpoint's job is to notify the
// team, and a visitor's submission must never fail because the app was slow or
// down. Failures are logged and swallowed.
const LEAD_INGEST_URL = process.env.LEAD_INGEST_URL || 'https://app.sicusmedia.com/api/public/leads';
const LEAD_INGEST_TIMEOUT_MS = 3000;

async function recordLead(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LEAD_INGEST_TIMEOUT_MS);
  try {
    const res = await fetch(LEAD_INGEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('Lead ingest rejected:', res.status, text.slice(0, 200));
    }
  } catch (err) {
    console.error('Lead ingest failed:', err && err.name === 'AbortError' ? 'timed out' : err);
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  // CORS (same origin in practice, but be permissive for preview deploys)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};

  // Validate email (required by every form that posts here)
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // Every demo-request form promises a call back, so a reachable phone number
  // is required on all three. Listed explicitly rather than applied globally:
  // the Brand Kit form has no phone field and must keep working, as must any
  // future caller. Keyed on `source`, not `lang` — the homepage sends
  // lang: 'vi' whenever a visitor flips the site language toggle.
  const PHONE_REQUIRED_SOURCES = [
    'Vietnamese landing page (/vi)',
    'Homepage hero form',
    'Homepage demo form',
  ];
  const phone = (body.phone || '').toString().trim();
  if (PHONE_REQUIRED_SOURCES.includes(body.source) && phone.replace(/[^0-9]/g, '').length < 10) {
    return res.status(400).json({ error: 'Please enter a valid phone number.' });
  }

  // Normalize the name across the two form shapes:
  //  - homepage demo form: first_name + last_name
  //  - brand kit form:     full_name
  const firstName = (body.first_name || '').toString().trim();
  const lastName = (body.last_name || '').toString().trim();
  const fullName = (body.full_name || `${firstName} ${lastName}`).toString().trim();

  const isBrandKit = !!body.full_name || !!body.city_state || !!body.salon_type;
  const formLabel = isBrandKit ? 'Brand Kit request' : 'Demo request';
  const heading = `New ${formLabel}${fullName ? ' — ' + fullName : ''}`;

  const fields = [
    { label: 'Name', value: fullName },
    { label: 'Email', value: email },
    { label: 'Phone', value: phone },
    { label: 'Salon', value: body.salon_name },
    { label: 'Message', value: body.message },
    { label: 'City / State', value: body.city_state },
    { label: 'Salon type', value: body.salon_type },
    { label: 'Source', value: body.source || formLabel },
    { label: 'Language', value: body.lang },
    { label: 'UTM source', value: body.utm_source },
    { label: 'UTM medium', value: body.utm_medium },
    { label: 'UTM campaign', value: body.utm_campaign },
  ];

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID; // optional

  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'Email service not configured. Please try again later.' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: TO_ADDRESSES,
        reply_to: email,
        subject: heading,
        html: emailHtml(heading, fields),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend API error:', response.status, errText);
      return res.status(500).json({ error: 'Could not send your message. Please try again or email info@sicusmedia.com.' });
    }

    // Best-effort lead storage — fire-and-forget, never blocks the response.
    addToAudience(apiKey, audienceId, email, firstName || fullName.split(' ')[0], lastName).catch(function (err) {
      console.error('addToAudience unexpected rejection:', err);
    });

    // Awaited rather than fire-and-forget: on Vercel the function can be frozen
    // the moment the response is sent, which would drop the request. Capped at
    // LEAD_INGEST_TIMEOUT_MS and never throws, so the visitor still gets a fast
    // success either way.
    await recordLead({
      email,
      name: fullName,
      first_name: firstName,
      last_name: lastName,
      phone,
      salon_name: body.salon_name,
      message: body.message,
      source: body.source || formLabel,
      lang: body.lang,
      utm_source: body.utm_source,
      utm_medium: body.utm_medium,
      utm_campaign: body.utm_campaign,
    });

    return res.status(200).json({ success: true, message: "Thanks — we'll be in touch shortly." });
  } catch (err) {
    console.error('Unexpected error sending contact email:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
