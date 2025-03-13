require('dotenv').config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const DISCORD_BOT_TOKEN = process.env.TOKEN; // Corrected typo
const GUILD_ID = "1325850250027597845";
const TARGET_ROLE_NAME = "Laukiantis Atsakymo";
const COOKIE_API_KEY = process.env.COOKIE_API_KEY; // Add this to your .env file

app.post("/api/check-role", async (req, res) => {
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: "User ID is required" });

    try {
        const response = await fetch("https://api.cookie-api.com/api/discord/user-info", {
            method: "POST",
            headers: {
                "Authorization": COOKIE_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                bot_token: DISCORD_BOT_TOKEN,
                guild_id: GUILD_ID,
                user_id: userId
            })
        });

        if (!response.ok) throw new Error("Failed to fetch user data");

        const userData = await response.json();
        const hasRole = userData.roles.some(role => role.name === TARGET_ROLE_NAME);

        res.json({ hasRole });
    } catch (error) {
        console.error("Error checking role:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));
