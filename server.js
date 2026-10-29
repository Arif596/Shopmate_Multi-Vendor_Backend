// const app = require("./app");
// const AdminUserCreation = require("./Utils/seedAdmin")
// const { v2: cloudinary } = require("cloudinary");
// AdminUserCreation();
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
//   api_key: process.env.CLOUDINARY_CLIENT_API,
//   api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
// });
// app.listen(process.env.PORT, () => {
//   console.log(`Server is running on Port ${process.env.PORT}`);
// });
require("dotenv").config({override: true});

const app = require("./app");
const CreateTables = require("./Utils/CreateTables");
const AdminUserCreation = require("./Utils/seedAdmin");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

async function startServer() {
  try {
    await app.locals.databaseReady;

    app.listen(process.env.PORT, () => {
      console.log(`Server is running on Port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();