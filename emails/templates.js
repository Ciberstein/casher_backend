const { layout, fmt, amountBadge, statusBadge, detail, detailTable } = require('./layout');

exports.transferReceived = ({ senderName, amount, currency }) => ({
  subject: `Recibiste ${fmt(amount, currency)} de ${senderName}`,
  html: layout({
    preheader: `${senderName} te ha enviado ${fmt(amount, currency)}`,
    body: `
      <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#18181b;">Tienes una nueva transferencia</p>
      <p style="margin:0 0 24px;color:#52525b;">${senderName} te ha enviado dinero a tu cuenta Casher.</p>
      ${amountBadge(amount, currency)}
      ${detailTable(
        detail('Enviado por', senderName) +
        detail('Moneda', currency)
      )}
      <p style="margin:24px 0 0;color:#71717a;font-size:13px;">El saldo ya está disponible en tu cuenta.</p>
    `,
  }),
});

exports.transferRequested = ({ requesterName, amount, currency }) => ({
  subject: `${requesterName} te solicitó ${fmt(amount, currency)}`,
  html: layout({
    preheader: `${requesterName} te ha enviado una solicitud de pago por ${fmt(amount, currency)}`,
    body: `
      <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#18181b;">Solicitud de pago pendiente</p>
      <p style="margin:0 0 24px;color:#52525b;"><strong>${requesterName}</strong> te ha enviado una solicitud de pago. Puedes aceptarla o rechazarla desde la aplicación.</p>
      ${amountBadge(amount, currency, '#ca8a04')}
      ${detailTable(
        detail('Solicitado por', requesterName) +
        detail('Moneda', currency)
      )}
      <p style="margin:24px 0 0;color:#71717a;font-size:13px;">Si no reconoces esta solicitud, puedes rechazarla desde tu cuenta.</p>
    `,
  }),
});

exports.withdrawalStatus = ({ status, amount, currency, bankName }) => {
  const accepted = status === 'accepted';
  return {
    subject: `Tu retiro de ${fmt(amount, currency)} fue ${accepted ? 'aprobado' : 'rechazado'}`,
    html: layout({
      preheader: `Tu solicitud de retiro fue ${accepted ? 'procesada exitosamente' : 'rechazada'}`,
      body: `
        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#18181b;">Solicitud de retiro</p>
        <p style="margin:0 0 16px;color:#52525b;">
          ${accepted
            ? 'Tu solicitud de retiro ha sido aprobada y procesada.'
            : 'Lamentablemente tu solicitud de retiro fue rechazada. El saldo vuelve a estar disponible en tu cuenta.'}
        </p>
        ${statusBadge(accepted)}
        ${amountBadge(amount, currency, accepted ? '#16a34a' : '#dc2626')}
        ${detailTable(
          detail('Monto', fmt(amount, currency)) +
          (bankName ? detail('Cuenta destino', bankName) : '')
        )}
      `,
    }),
  };
};

exports.depositStatus = ({ status, amount, currency, bankName }) => {
  const accepted = status === 'accepted';
  return {
    subject: `Tu recarga de ${fmt(amount, currency)} fue ${accepted ? 'aprobada' : 'rechazada'}`,
    html: layout({
      preheader: `Tu solicitud de recarga fue ${accepted ? 'aprobada' : 'rechazada'}`,
      body: `
        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#18181b;">Solicitud de recarga de fondos</p>
        <p style="margin:0 0 16px;color:#52525b;">
          ${accepted
            ? 'Tu recarga fue aprobada. El saldo ya está disponible en tu cuenta Casher.'
            : 'Lamentablemente tu solicitud de recarga fue rechazada. Verifica el comprobante e intenta nuevamente.'}
        </p>
        ${statusBadge(accepted)}
        ${amountBadge(amount, currency, accepted ? '#16a34a' : '#dc2626')}
        ${detailTable(
          detail('Monto', fmt(amount, currency)) +
          (bankName ? detail('Cuenta origen', bankName) : '')
        )}
      `,
    }),
  };
};

exports.loanStatus = ({ status, amount, currency, interestRate }) => {
  const accepted = status === 'accepted';
  return {
    subject: `Tu préstamo de ${fmt(amount, currency)} fue ${accepted ? 'aprobado' : 'rechazado'}`,
    html: layout({
      preheader: `Tu solicitud de préstamo fue ${accepted ? 'aprobada' : 'rechazada'}`,
      body: `
        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#18181b;">Solicitud de préstamo</p>
        <p style="margin:0 0 16px;color:#52525b;">
          ${accepted
            ? 'Tu solicitud de préstamo fue aprobada. El monto ya está disponible en tu saldo.'
            : 'Lamentablemente tu solicitud de préstamo fue rechazada.'}
        </p>
        ${statusBadge(accepted)}
        ${amountBadge(amount, currency, accepted ? '#16a34a' : '#dc2626')}
        ${detailTable(
          detail('Monto', fmt(amount, currency)) +
          (accepted && interestRate != null ? detail('Tasa de interés', `${interestRate}% diario`) : '')
        )}
      `,
    }),
  };
};
