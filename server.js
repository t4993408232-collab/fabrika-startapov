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
    `Новая заявка с сайта «Фабрика стартапов»`,
    ``,
    `Имя: ${name}`,
    company ? `Компания: ${company}` : null,
    `Телефон: ${phone}`,
    email ? `E-mail: ${email}` : null,
    message ? `Комментарий: ${message}` : null,
    ``,
    `Дата: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
  ].filter(Boolean).join('\n');

  // If SMTP is configured, send email
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
        text,
      });

      console.log(`[LEAD] Email sent — ${name}, ${phone}`);
    } catch (err) {
      console.error('[LEAD] Email error:', err.message);
      // Still return 200 — lead is logged
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
