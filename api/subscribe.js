// Vercel serverless function — lead magnet email capture.
// Accepts POST { email, magnet }, sends the requested PDF via Resend,
// stores the subscriber in a Resend Audience for future broadcasts.
// Uses native fetch (Node 18+) — no npm dependencies.
//
// Required env vars:
//   RESEND_API_KEY     — Resend API key (required for email sending)
//   RESEND_AUDIENCE_ID — Resend Audience UUID (optional; if present, subscribers are added to the audience)
//
// If RESEND_AUDIENCE_ID is not set, the email still sends but leads are not stored.

// Each magnet can optionally include a `gdocUrl` — a Google Docs force-copy
// link (ends in /copy) that prompts the recipient to duplicate the document
// into their own Google Drive. Leave gdocUrl empty to deliver PDF only.
const MAGNETS = {
  'business-plan-template': {
    subject: 'Your Salon Business Plan Template (Free Download)',
    title: 'Salon Business Plan Template',
    blurb: 'A complete, bank-ready salon business plan built around a hypothetical Calgary nail & beauty spa. Customize the numbers, submit it to your lender.',
    pdfUrl: 'https://sicusmedia.com/downloads/salon-business-plan-template.pdf',
    gdocUrl: '', // TODO: paste Google Docs force-copy URL (e.g., https://docs.google.com/document/d/ABC/copy)
  },
  'how-to-open-checklist': {
    subject: 'Your 90-Day Salon Startup Guide + Checklist (Free Download)',
    title: 'How to Open a Salon — 15-Step Guide + 90-Day Checklist',
    blurb: 'The complete 15-step guide from concept validation to opening day, with a printable 90-day startup checklist organized by phase. Everything you need to stay on track.',
    pdfUrl: 'https://sicusmedia.com/downloads/how-to-open-a-salon.pdf',
    gdocUrl: '',
  },
  'funding-options-cheatsheet': {
    subject: 'Your Salon Funding Options Cheatsheet (Free Download)',
    title: 'Salon Funding Options: 7 Ways to Finance Your New Salon',
    blurb: 'Compare SBA loans, BDC loans, bank loans, lines of credit, equipment financing, investors, and grants — with 2026 rates, qualifications, and a decision tree to pick the right option.',
    pdfUrl: 'https://sicusmedia.com/downloads/salon-funding-options.pdf',
    gdocUrl: '',
  },
  'alberta-licensing-guide': {
    subject: 'Your Alberta Salon Licensing Guide (Free Download)',
    title: 'Salon Licences in Alberta — Complete 2026 Guide',
    blurb: 'Every permit, licence, and registration you need to legally open a nail, hair, or beauty salon in Alberta, with real 2026 fees, a 6-week timeline, and a printable checklist for Calgary and Edmonton owners.',
    pdfUrl: 'https://sicusmedia.com/downloads/salon-licences-alberta.pdf',
    gdocUrl: '',
  },
};

const FROM_ADDRESS = 'SICUS Media <hello@sicusmedia.com>';
const UNSUBSCRIBE_MAILTO = 'mailto:info@sicusmedia.com?subject=Unsubscribe%20me';

function emailHtml({ title, blurb, pdfUrl, gdocUrl }) {
  // Build the download buttons — always show PDF, conditionally show Google Doc
  var pdfButton = `<a href="${pdfUrl}" style="display:inline-block;background:linear-gradient(135deg,#8CB82B,#6A9A10);color:#ffffff;font-weight:700;font-size:16px;padding:14px 28px;border-radius:999px;text-decoration:none;box-shadow:0 4px 16px rgba(140,184,43,0.3);margin:4px;">Download the PDF →</a>`;
  var gdocButton = gdocUrl
    ? `<a href="${gdocUrl}" style="display:inline-block;background:#ffffff;color:#6A9A10;font-weight:700;font-size:16px;padding:13px 28px;border-radius:999px;text-decoration:none;border:2px solid #8CB82B;margin:4px;">Open in Google Docs →</a>`
    : '';
  var helpText = gdocUrl
    ? `<p style="margin:12px 0 0 0;font-size:13px;line-height:1.6;color:#9ca3af;text-align:center;">Click <strong>Open in Google Docs</strong> to copy the template into your Google Drive (fully editable), or <strong>Download the PDF</strong> for printing.</p>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:32px 40px 24px 40px;border-bottom:3px solid #8CB82B;">
              <img src="https://sicusmedia.com/brand_assets/topbar.png" alt="SICUS MEDIA" height="36" style="display:block;">
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 16px 40px;">
              <h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.3;color:#111827;font-weight:700;letter-spacing:-0.02em;">Your ${title} is ready</h1>
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#4b5563;">Hey there — thanks for grabbing this resource. Here's your download:</p>
              <p style="margin:0 0 8px 0;font-size:16px;line-height:1.6;color:#4b5563;">${blurb}</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 40px 32px 40px;">
              ${pdfButton}
              ${gdocButton}
              ${helpText}
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <div style="height:1px;background:#e5e7eb;margin:8px 0 24px 0;"></div>
              <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#6b7280;"><strong>A quick note on what to do next:</strong></p>
              <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#6b7280;">Open the PDF in Google Docs or Word, replace the hypothetical salon details with your own (name, location, financial numbers, competitor analysis), and submit it to your lender. Most banks accept this format as-is.</p>
              <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#6b7280;">If you'd like a 30-minute strategy call to talk through your specific situation, reply to this email or <a href="https://sicusmedia.com/#schedule-demo" style="color:#6A9A10;text-decoration:none;font-weight:600;">book one here</a> — no cost, no pitch.</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">— The SICUS Media team</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background:#fafafa;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;text-align:center;">Sicus Media Inc. &middot; 103 Citadel Point NW, Calgary, AB T3G 5L2 &middot; <a href="mailto:info@sicusmedia.com" style="color:#9ca3af;text-decoration:underline;">info@sicusmedia.com</a></p>
              <p style="margin:8px 0 0 0;font-size:12px;line-height:1.6;color:#9ca3af;text-align:center;">You received this email because you requested a free resource from sicusmedia.com. <a href="${UNSUBSCRIBE_MAILTO}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a> anytime and we won't contact you again.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Best-effort call to add a subscriber to a Resend Audience.
 * Non-blocking — logs errors but does not throw. The email delivery
 * is the primary goal; audience storage is a bonus.
 */
async function addToAudience(apiKey, audienceId, email) {
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
        unsubscribed: false,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      // A 409 "contact already exists" is expected for returning subscribers — don't treat as error
      if (res.status === 409 || /already exists/i.test(errText)) {
        console.log('Contact already in audience:', email);
        return;
      }
      console.error('Resend Audiences API error:', res.status, errText);
    }
  } catch (err) {
    console.error('Unexpected error adding contact to audience:', err);
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

  const { email, magnet } = req.body || {};

  // Validate email
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // Validate magnet
  const magnetConfig = MAGNETS[magnet];
  if (!magnetConfig) {
    return res.status(400).json({ error: 'Unknown resource requested.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID; // optional

  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'Email service not configured. Please try again later.' });
  }

  // Send the email via Resend (primary goal)
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        subject: magnetConfig.subject,
        html: emailHtml(magnetConfig),
        headers: {
          // Gmail / Outlook 2024 bulk-sender compliance — gives recipients a native unsubscribe mechanism
          'List-Unsubscribe': `<${UNSUBSCRIBE_MAILTO}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend API error:', response.status, errText);
      return res.status(500).json({ error: 'Could not send the email. Please try again or contact info@sicusmedia.com.' });
    }

    // Best-effort: add to Resend Audience for future broadcasts & nurture sequences.
    // Fire-and-forget — we don't await this. If it fails, the user still got their PDF.
    addToAudience(apiKey, audienceId, email).catch(function(err) {
      console.error('addToAudience unexpected rejection:', err);
    });

    return res.status(200).json({ success: true, message: 'Check your inbox in a minute or two.' });
  } catch (err) {
    console.error('Unexpected error sending email:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
