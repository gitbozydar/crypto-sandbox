// Funkcja „wysyłająca” mail — wypisuje link w terminalu.
export const sendMail = ({ to, subject, url }: { to: string; subject: string; url: string }) => {
  console.log(`\n📧 ${subject} → ${to}\n   ${url}\n`);
};
