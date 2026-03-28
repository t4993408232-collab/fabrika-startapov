const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Lead form endpoint
app.post('/api/lead', async (req, res) => {
  const { name, company, phone, email, message } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Имя и телефон обязательны' });
  }

  const text = [
    `📩 Новая заявка с сайта «Фабрика стартапов»`,
    ``,
    `👤 Имя: ${name}`,
    company ? `🏢 Компания: ${company}` : null,
    `📱 Телефон: ${phone}`,
    email ? `📧 E-mail: ${email}` : null,
    message ? `💬 Комментарий: ${message}` : null,
    ``,
    `🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
  ].filter(Boolean).join('\n');

  // Send to Telegram bot
  const TG_TOKEN = process.env.TG_BOT_TOKEN || '8703833785:AAEvTZO6jPo-PQYl0RNUE1ggzkY10LPNbRU';
  const TG_CHAT = process.env.TG_CHAT_ID || '363075534';
  if (TG_TOKEN && TG_CHAT) {
    try {
      const tgUrl = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
      await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT,
          text,
          parse_mode: 'HTML',
        }),
      });
      console.log(`[LEAD] Telegram sent — ${name}, ${phone}`);
    } catch (err) {
      console.error('[LEAD] Telegram error:', err.message);
    }
  }

  // Send email via SMTP if configured
  if (process.env.SMTP_HOST) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: 'info@doctorteam.ru',
        subject: `Заявка: ${name}${company ? ' — ' + company : ''}`,
        text: text.replace(/[📩👤🏢📱📧💬🕐]/g, ''),
      });

      console.log(`[LEAD] Email sent — ${name}, ${phone}`);
    } catch (err) {
      console.error('[LEAD] Email error:', err.message);
    }
  }

  // Always log to console (visible in Render logs)
  console.log(`[LEAD] ${text}`);
  res.json({ ok: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
