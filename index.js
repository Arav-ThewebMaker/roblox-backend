const express = require("express");
const fs = require("fs");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const FILE_PATH = "./players.json";

function readPlayers() {
  if (!fs.existsSync(FILE_PATH)) return { players: [] };
  return JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
}

function writePlayers(data) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

const thumbnailCache = new Map();

async function getGameIcon(universeId) {
  if (thumbnailCache.has(universeId)) {
    return thumbnailCache.get(universeId);
  }

  const url =
    "https://thumbnails.roblox.com/v1/games/icons" +
    `?universeIds=${universeId}&size=256x256&format=Png&isCircular=false`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const entry = json.data && json.data[0];

    if (entry && entry.state === "Completed") {
      thumbnailCache.set(universeId, entry.imageUrl);
      return entry.imageUrl;
    }
  } catch (err) {
    console.error("Thumbnail fetch failed:", universeId, err);
  }

  return null;
}

async function getUserCreations(userId) {
  const creations = [];

  try {
    let cursor = "";
    let hasNextPage = true;

    while (hasNextPage) {
      const url =
        `https://games.roblox.com/v2/users/${userId}/games` +
        `?limit=50&sortOrder=Asc&cursor=${cursor}`;

      const response = await fetch(url);
      if (!response.ok) break;

      const json = await response.json();

      for (const game of json.data) {
        const universeId = game.id;
        const iconUrl = await getGameIcon(universeId);

        creations.push({
          name: game.name,
          universeId: universeId,
          iconUrl: iconUrl
        });
      }

      cursor = json.nextPageCursor;
      hasNextPage = !!cursor;
    }
  } catch (err) {
    console.error("Error fetching user creations:", err);
  }

  return creations;
}

app.post("/player-join", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "UserId required" });
  }

  const data = readPlayers();
  if (!data.players.includes(userId)) {
    data.players.push(userId);
    writePlayers(data);
  }

  const creations = await getUserCreations(userId);

  res.json({
    uniquePlayers: data.players.length,
    players: data.players,
    latestJoiner: userId,
    creations
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
