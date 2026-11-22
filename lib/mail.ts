import nodemailer from "nodemailer";

type Mail = { to: string; subject: string; heading: string; text: string; button: string; url: string };

const { SMTP_HOST = "smtp.gmail.com", SMTP_PORT = "465", SMTP_USER, SMTP_PASSWORD } = process.env;

const transport =
  SMTP_USER && SMTP_PASSWORD
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: SMTP_PORT === "465",
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD.replace(/\s/g, "") },
      })
    : null;

// Funkcja zamieniająca znaki specjalne na encje HTML (ochrona przed wstrzyknięciem kodu do maila).
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Funkcja budująca treść maila w HTML: nagłówek, tekst i przycisk z linkiem.
const toHtml = ({ heading, text, button, url }: Mail) => `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1a1a1a">
    <h2 style="margin:0 0 12px">${escape(heading)}</h2>
    <p style="margin:0 0 20px;line-height:1.5">${escape(text)}</p>
    <a href="${escape(url)}" style="display:inline-block;background:#39ff88;color:#03140a;padding:12px 20px;border-radius:8px;font-weight:bold;text-decoration:none">${escape(button)}</a>
    <p style="margin:20px 0 0;font-size:12px;color:#666">Jeśli to nie Ty, zignoruj tę wiadomość.</p>
  </div>`;

// Funkcja wysyłająca mail przez SMTP (Gmail); bez danych w .env wypisuje link w terminalu.
export const sendMail = async (mail: Mail) => {
  if (!transport) {
    console.log(`\n📧 ${mail.subject} → ${mail.to}\n   ${mail.url}\n`);
    return;
  }
  await transport.sendMail({
    from: `Crypto Sandbox <${SMTP_USER}>`,
    to: mail.to,
    subject: mail.subject,
    html: toHtml(mail),
    text: `${mail.text}\n\n${mail.button}: ${mail.url}`,
  });
};
