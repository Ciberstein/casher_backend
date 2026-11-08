// Crea usuarios y préstamos de prueba para la pestaña "Deudas" del admin.
//   node scripts/seed-demo-loans.js          -> crea (o recrea) los datos demo
//   node scripts/seed-demo-loans.js --clean  -> solo elimina los datos demo
// Los usuarios demo usan el sufijo @demo.casher.test para poder identificarlos.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { db } = require('../database/config');
const initModel = require('../models/initModels');
const User = require('../models/accounts.model');
const Loan = require('../models/loan.model');

const DEMO_DOMAIN = '@demo.casher.test';
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// loans: [monto, moneda, días desde que se aceptó, abonado, estado]
const DEMO = [
  {
    username: 'demo_laura',
    loans: [
      [500000, 'COP', 45, 0, 'accepted'],
      [1200000, 'COP', 20, 300000, 'accepted'],
      [250000, 'COP', 5, 0, 'accepted'],
      [800000, 'COP', 90, 0, 'rejected'],
    ],
  },
  {
    username: 'demo_carlos',
    loans: [
      [300, 'USD', 30, 0, 'accepted'],
      [150, 'USD', 10, 50, 'accepted'],
      [2000000, 'COP', 15, 0, 'accepted'],
    ],
  },
  { username: 'demo_marta', loans: [[3500000, 'COP', 60, 500000, 'accepted']] },
  {
    username: 'demo_pedro',
    loans: [
      [400000, 'COP', 70, 2000000, 'paid'],
      [100000, 'COP', 8, 0, 'accepted'],
    ],
  },
  { username: 'demo_sofia', loans: [[600, 'USD', 25, 0, 'accepted']] },
  { username: 'demo_sin_deuda', loans: [[900000, 'COP', 0, 0, 'rejected']] },
];

// Préstamos para una cuenta real, p. ej.: node scripts/seed-demo-loans.js --main=correo@dominio.com
// Es aditivo: los préstamos no llevan marca, así que --clean NO los borra (se imprimen los ids).
const MAIN_LOANS = [
  [1500000, 'COP', 40, 0, 'accepted'],
  [600000, 'COP', 12, 150000, 'accepted'],
  [250, 'USD', 18, 0, 'accepted'],
  [900000, 'COP', 3, 0, 'pending'],
  [300000, 'COP', 60, 0, 'rejected'],
  [200000, 'COP', 50, 900000, 'paid'],
];

const seedMainUser = async (email) => {
  const account = await User.Accounts.findOne({ where: { email } });
  if (!account) throw new Error(`No existe la cuenta ${email}`);
  const ids = [];
  for (const [amount, currency, days, paid, status] of MAIN_LOANS) {
    const loan = await Loan.create({
      amount,
      currency,
      interest_rate: account.interest_rate,
      status,
      accountId: account.id,
      accepted_at: status === 'accepted' || status === 'paid' ? daysAgo(days) : null,
      paid_amount: paid,
    });
    ids.push(loan.id);
  }
  console.log(`${account.username}: ${ids.length} préstamos (ids ${ids.join(', ')})`);
};

const clean = async () => {
  const accounts = await User.Accounts.findAll({ where: { email: { [Op.like]: `%${DEMO_DOMAIN}` } } });
  const ids = accounts.map(a => a.id);
  if (ids.length) {
    await Loan.destroy({ where: { accountId: ids } });
    await User.Accounts.destroy({ where: { id: ids } });
  }
  return ids.length;
};

(async () => {
  await db.authenticate();
  initModel();

  const mainArg = process.argv.find(a => a.startsWith('--main='));
  if (mainArg) return seedMainUser(mainArg.slice('--main='.length));

  const removed = await clean();
  if (removed) console.log(`Eliminados ${removed} usuarios demo previos`);
  if (process.argv.includes('--clean')) return;

  const password = await bcrypt.hash('Demo1234!', 10);

  for (const { username, loans } of DEMO) {
    const account = await User.Accounts.create({
      username,
      email: `${username}${DEMO_DOMAIN}`,
      password,
      status: 'active',
    });

    for (const [amount, currency, days, paid, status] of loans) {
      await Loan.create({
        amount,
        currency,
        interest_rate: account.interest_rate,
        status,
        accountId: account.id,
        accepted_at: status === 'accepted' || status === 'paid' ? daysAgo(days) : null,
        paid_amount: paid,
      });
    }
    console.log(`${username}: ${loans.length} préstamos`);
  }
})()
  .catch(err => { console.error(err); process.exitCode = 1; })
  .finally(() => db.close());
