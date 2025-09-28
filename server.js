const express = require("express");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "locations.jsonl");

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Endpoint to receive location
app.post("/api/location", (req, res) => {
  try {
    const payload = req.body;
    if (
      !payload ||
      typeof payload.latitude !== "number" ||
      typeof payload.longitude !== "number"
    ) {
      return res.status(400).send("invalid payload");
    }

    fs.appendFileSync(
      DATA_FILE,
      JSON.stringify({ receivedAt: new Date().toISOString(), payload }) + "\n"
    );

    console.log(
      "saved location",
      payload.clientId,
      payload.latitude,
      payload.longitude
    );
    res.status(201).send("ok");
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
});

app.listen(PORT, () => console.log("Server started on port", PORT));
