const express = require("express");

const app = express();

const PORT = 5000;

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FlowForge API is running"
  });
});

app.listen(PORT, () => {
  console.log(`FlowForge API running on port ${PORT}`);
});