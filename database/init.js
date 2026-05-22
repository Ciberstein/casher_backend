const { db } = require("./config");
const initModel = require("../models/initModels");

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

  await db.sync({ force: false });
  console.log("DB synced");
};

module.exports = initDatabase;
