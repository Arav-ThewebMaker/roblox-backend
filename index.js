const express = require("express");
const fs = require("fs");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const FILE_PATH = "./players.json";

// Read stored player data
function readPlayers() {
  if (!fs.existsSync(FILE_PATH)) return { players: [] };
  const data = fs.readFileSync(FILE_PATH, "utf-8");
  return JSON.parse(data);
}

// Write player data
function writePlayers(data) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

// Fetch public creations (games) of a Roblox user by userId
async function getUserCreations(userId) {
  const creations = [];

  try {
    let cursor = ""; // pagination cursor
    let hasNextPage = true;

    while (hasNextPage) {
      const url = `https://games.roblox.com/v1/users/${userId}/games?limit=50&sortOrder=Asc&cursor=${cursor}`;
      const response = await fetch(url);
      if (!response.ok) break;

      const json = await response.json();
      json.data.forEach(game => {
        creations.push({
          name: game.name,
          placeId: game.rootPlaceId
        });
      });

      cursor = json.nextPageCursor;
      hasNextPage = !!cursor;
    }
  } catch (err) {
    console.error("Error fetching user creations:", err);
  }

  return creations;
}

// Endpoint for Roblox player join
app.post("/player-join", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "UserId required" });
  }

  // Save player to local JSON
  const data = readPlayers();
  if (!data.players.includes(userId)) {
    data.players.push(userId);
    writePlayers(data);
  }

  // Fetch public creations
  const creations = await getUserCreations(userId);

  res.json({
    uniquePlayers: data.players.length,
    players: data.players,
    creations: creations
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
