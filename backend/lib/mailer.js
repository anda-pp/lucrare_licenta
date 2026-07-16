import nodemailer from 'nodemailer';

// Modulul de email al aplicației — folosim Nodemailer cu SMTP
// În development: Mailtrap (sandbox); în producție: se configurează din .env
// Variabile necesare: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

let transporter = null;

// Inițializăm transporter-ul o singură dată (singleton) ca să nu creăm conexiuni multiple
function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
            port: parseInt(process.env.SMTP_PORT) || 587,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return transporter;
}

const FROM = () => process.env.SMTP_FROM || '"MuseumPass" <noreply@museumpass.ro>';

// Template HTML de bază — wrapper cu header purple și footer pentru toate emailurile
function wrapHtml(title, bodyHtml) {
    return `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f5f3ff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(147,51,234,0.08);">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#7c3aed,#9333ea);padding:28px 32px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">🏛️ MuseumPass</h1>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:32px;">
    ${bodyHtml}
  </td></tr>
  <!-- Footer -->
  <tr><td style="background:#faf5ff;padding:20px 32px;text-align:center;border-top:1px solid #ede9fe;">
    <p style="margin:0;font-size:12px;color:#7c3aed;">© ${new Date().getFullYear()} MuseumPass — Platforma ta de muzee</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// Helpers pentru elementele HTML din corpul emailului
const heading = (text) => `<h2 style="margin:0 0 16px;color:#2e1065;font-size:20px;">${text}</h2>`;
const paragraph = (text) => `<p style="margin:0 0 14px;color:#4c1d95;font-size:15px;line-height:1.6;">${text}</p>`;
const highlight = (text) => `<div style="background:#f5f3ff;border-left:4px solid #9333ea;padding:14px 18px;border-radius:8px;margin:18px 0;">
  <p style="margin:0;color:#6d28d9;font-size:15px;font-weight:600;">${text}</p>
</div>`;
const button = (url, label) => `<div style="text-align:center;margin:24px 0;">
  <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:25px;font-weight:600;font-size:15px;">${label}</a>
</div>`;
const divider = () => `<hr style="border:none;border-top:1px solid #ede9fe;margin:20px 0;">`;

// Confirmare comandă — trimis după plata cu succes, cu PDF-ul biletelor atașat
export async function sendOrderConfirmation(to, { orderId, total, tickets, locationName, dataVizita }, pdfBuffer) {
    const ticketLines = tickets.map(t => `<li>${t.cantitate}x ${t.tipBilet} — ${(t.pret * t.cantitate).toFixed(2)} Lei</li>`).join('');
    const dateStr = dataVizita
        ? new Date(dataVizita + 'T12:00:00').toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : 'Nedefinită';

    const html = wrapHtml('Confirmare Comandă', `
        ${heading('Comandă confirmată! ✅')}
        ${paragraph(`Mulțumim pentru achiziție! Comanda ta <strong>#${orderId}</strong> a fost procesată cu succes.`)}
        ${highlight(`Total plătit: ${total.toFixed(2)} Lei`)}
        ${divider()}
        ${paragraph(`<strong>Locație:</strong> ${locationName}`)}
        ${paragraph(`<strong>Data vizitei:</strong> ${dateStr}`)}
        ${paragraph('<strong>Bilete:</strong>')}
        <ul style="color:#4c1d95;font-size:14px;line-height:1.8;padding-left:20px;">${ticketLines}</ul>
        ${divider()}
        ${paragraph('Biletele tale sunt atașate în format PDF. Prezintă codul QR la intrare.')}
        ${button(process.env.FRONTEND_URL + '/user/orders', 'Vezi Comenzile Mele')}
    `);

    const attachments = pdfBuffer ? [{
        filename: `Bilete_Comanda_${orderId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
    }] : [];

    return getTransporter().sendMail({
        from: FROM(),
        to,
        subject: `Confirmare Comandă #${orderId} — MuseumPass`,
        html,
        attachments,
    });
}

// Notificare eveniment nou — trimis utilizatorilor care au o locație la favorite când aceasta publică un eveniment
export async function sendNewEventAtFavorite(to, { eventTitle, eventType, locationName, dataStart }) {
    const dateStr = new Date(dataStart).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const html = wrapHtml('Eveniment Nou', `
        ${heading('Eveniment nou la una dintre locațiile tale favorite! 🎉')}
        ${paragraph(`<strong>${locationName}</strong> a publicat un eveniment nou:`)}
        ${highlight(`${eventTitle} (${eventType})`)}
        ${paragraph(`<strong>Data:</strong> ${dateStr}`)}
        ${paragraph('Nu rata ocazia — verifică detaliile și rezervă-ți locul!')}
        ${button(process.env.FRONTEND_URL + '/user/events', 'Vezi Evenimentele')}
    `);

    return getTransporter().sendMail({
        from: FROM(),
        to,
        subject: `🎉 Eveniment nou la ${locationName} — ${eventTitle}`,
        html,
    });
}

// Notificare locație nouă — trimis utilizatorilor când un muzeu sau galerie nouă e adăugată în platformă
export async function sendNewMuseum(to, { locationName, city, type }) {
    const html = wrapHtml('Locație Nouă', `
        ${heading('O nouă locație te așteaptă! 🏛️')}
        ${paragraph(`Un nou <strong>${type}</strong> a fost adăugat pe MuseumPass:`)}
        ${highlight(`${locationName} — ${city}`)}
        ${paragraph('Descoperă-l acum și adaugă-l la favorite!')}
        ${button(process.env.FRONTEND_URL + '/user/locations', 'Explorează Locații')}
    `);

    return getTransporter().sendMail({
        from: FROM(),
        to,
        subject: `🏛️ ${type} nou: ${locationName} (${city})`,
        html,
    });
}

// Notificare recompensă disponibilă — trimis când userul are suficiente puncte pentru o recompensă nouă adăugată
export async function sendNewRewardAvailable(to, { rewardName, rewardDescription, pointsCost, userPoints }) {
    const html = wrapHtml('Recompensă Nouă', `
        ${heading('O nouă recompensă este disponibilă! 🎁')}
        ${paragraph(`A fost adăugată o nouă recompensă pe care o poți revendica:`)}
        ${highlight(`${rewardName} — ${pointsCost} puncte`)}
        ${rewardDescription ? paragraph(rewardDescription) : ''}
        ${paragraph(`Ai <strong>${userPoints} puncte</strong> disponibile — destule pentru a revendica această recompensă!`)}
        ${button(process.env.FRONTEND_URL + '/user/rewards', 'Revendică Recompensa')}
    `);

    return getTransporter().sendMail({
        from: FROM(),
        to,
        subject: `🎁 Recompensă nouă disponibilă: ${rewardName}`,
        html,
    });
}

// Reminder Noaptea Muzeelor — trimis utilizatorilor pentru a-i anunța de evenimentul special
export async function sendNoapteaMuzeelorReminder(to, { eventTitle, locationName, dataStart }) {
    const dateStr = new Date(dataStart).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const html = wrapHtml('Noaptea Muzeelor', `
        ${heading('Noaptea Muzeelor se apropie! 🌙')}
        ${paragraph('Pregătește-te pentru una dintre cele mai importante nopți culturale ale anului!')}
        ${highlight(`${eventTitle}${locationName ? ` — ${locationName}` : ''}`)}
        ${paragraph(`<strong>Data:</strong> ${dateStr}`)}
        ${paragraph('Locurile sunt limitate — rezervă-ți locul cât mai curând!')}
        ${button(process.env.FRONTEND_URL + '/user/noaptea-muzeelor', 'Rezervă Loc')}
    `);

    return getTransporter().sendMail({
        from: FROM(),
        to,
        subject: `🌙 Noaptea Muzeelor se apropie — Rezervă-ți locul!`,
        html,
    });
}
