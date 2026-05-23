const { db } = require("./config");
const initModel = require("../models/initModels");
const Bank = require("../models/bank.model");
const DocumentType = require("../models/document_type.model");

const SEED_BANKS = [
  { name: 'Bancolombia', logo: '🏦', country: 'CO' },
  { name: 'Nequi', logo: '💜', country: 'CO' },
  { name: 'Binance', logo: '🟡', country: 'CO' },
];

const SEED_DOCUMENT_TYPES = [
  { name: 'Cédula de ciudadanía', abbreviation: 'CC', country: 'CO' },
  { name: 'Cédula de extranjería', abbreviation: 'CE', country: 'CO' },
  { name: 'Pasaporte', abbreviation: 'PA', country: 'CO' },
];

const SCHEMAS = ["users"];

const initDatabase = async () => {
  await db.authenticate();
  console.log("DB authenticated");

  const qi = db.getQueryInterface();

  for (const schema of SCHEMAS) {
    const existing = await qi.showAllSchemas();
    if (!existing.includes(schema)) {
      await qi.createSchema(schema);
      console.log(`Schema "${schema}" created`);
    } else {
      console.log(`Schema "${schema}" already exists`);
    }
  }

  initModel();

  await db.sync({ alter: true });
  console.log("DB synced");

  for (const bank of SEED_BANKS) {
    await Bank.findOrCreate({ where: { name: bank.name, country: bank.country } });
  }
  console.log("Banks seeded");

  for (const dt of SEED_DOCUMENT_TYPES) {
    await DocumentType.findOrCreate({ where: { abbreviation: dt.abbreviation, country: dt.country }, defaults: dt });
  }
  console.log("Document types seeded");
};

module.exports = initDatabase;
