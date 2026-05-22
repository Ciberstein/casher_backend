require("dotenv").config();
const { server } = require("./app");
const initDatabase = require("./database/init");

const port = process.env.PORT || 3011;

initDatabase()
  .then(() => {
    server.listen(port, () => {
      console.log(`App is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
