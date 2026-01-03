const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const FILE_PATH = "./players.json";

function readPlayers() {
    const data = fs.readFileSync(FILE_PATH, "utf-8");
    return JSON.parse(data);
}

function writePlayers(data) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

app.post("/player-join", (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "UserId required" });
    }

    const data = readPlayers();

    if (!data.players.includes(userId)) {
        data.players.push(userId);
        writePlayers(data);
    }

    res.json({
        uniquePlayers: data.players.length,
        players: data.players
    });
});

app.listen(3000, () => {
    console.log("Backend running on port 3000");
});
