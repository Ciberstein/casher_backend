const fmt = (amount, currency) =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-CO', {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(amount);

const layout = ({ preheader, body }) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Casher</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#16a34a;border-radius:12px 12px 0 0;padding:24px 32px;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Casher</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px;color:#18181b;font-size:15px;line-height:1.6;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f5;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;color:#71717a;font-size:12px;">
              © ${new Date().getFullYear()} Casher. No respondas a este correo.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const amountBadge = (amount, currency, color = '#16a34a') =>
  `<div style="margin:24px 0;padding:16px 24px;background:#f0fdf4;border-left:4px solid ${color};border-radius:6px;">
    <span style="font-size:28px;font-weight:700;color:${color};">${fmt(amount, currency)}</span>
  </div>`;

const statusBadge = (accepted) => accepted
  ? `<span style="display:inline-block;background:#dcfce7;color:#15803d;font-size:13px;font-weight:600;padding:4px 12px;border-radius:999px;">Aprobado</span>`
  : `<span style="display:inline-block;background:#fee2e2;color:#b91c1c;font-size:13px;font-weight:600;padding:4px 12px;border-radius:999px;">Rechazado</span>`;

const detail = (label, value) =>
  `<tr>
    <td style="padding:6px 0;color:#71717a;font-size:13px;">${label}</td>
    <td style="padding:6px 0;color:#18181b;font-size:13px;font-weight:600;text-align:right;">${value}</td>
  </tr>`;

const detailTable = (rows) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-top:1px solid #e4e4e7;">
    ${rows}
  </table>`;

module.exports = { layout, fmt, amountBadge, statusBadge, detail, detailTable };
