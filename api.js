require('dotenv').config();  // Ensure this is included to load environment variables
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const DISCORD_BOT_TOKEN = process.env.TOKEN; // Your bot token from .env
const GUILD_ID = "1325850250027597845"; // Your Discord Guild ID
const TARGET_ROLE_ID = "1332046743675600928"; // Role ID for "Laukiantis Atsakymo"

app.post("/api/check-role", async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        // Fetch user data from Discord API
        const response = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
            },
        });

        // If the response is not okay, throw an error
        if (!response.ok) {
            throw new Error(`Failed to fetch user data from Discord API. Status: ${response.status} - ${response.statusText}`);
        }

        // Parse the response data
        const userData = await response.json();

        // Check if the user has the target role by ID
        const hasRole = userData.roles.includes(TARGET_ROLE_ID);

        // Send the result back to the client
        res.json({ hasRole });

    } catch (error) {
        console.error("Error checking role:", error);
        res.status(500).json({ error: `Internal server error: ${error.message}` });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
