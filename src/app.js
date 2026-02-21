const express = require("express");

const app = express();

const healthCheck = require("./routes/healthCheck");

app.use(express.json());
console.log("Middleware is working!"); //REMOVE: debug only
console.log(process.env.PORT);

app.use("/api/v1", healthCheck);

module.exports = app;
