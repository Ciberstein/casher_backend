require("dotenv").config();
const app = require("./app");
const { db } = require("./database/config");
const initModel = require("./models/initModels");

db.authenticate()
  .then(() => console.log("db is authenticated"))
  .catch((err) => console.log(err));

initModel();

db.sync({ force: false })
  .then(() => console.log("db is synced"))
  .catch((err) => console.log(err));

const port = process.env.PORT || 3011;

app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
