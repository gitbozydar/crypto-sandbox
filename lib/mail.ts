// „Wysyłka” maili: na razie tylko wypisujemy link w terminalu serwera (npm run dev).
// Skopiuj link z terminala do przeglądarki, żeby potwierdzić e-mail albo ustawić nowe hasło.

export const sendMail = ({ to, subject, url }: { to: string; subject: string; url: string }) => {
  console.log(`\n📧 ${subject} → ${to}\n   ${url}\n`);
};
