require('dotenv').config();  // Ensure this is included to load environment variables
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const DISCORD_BOT_TOKEN = process.env.TOKEN; // Your bot token from .env
const GUILD_ID = "1325850250027597845"; // Your Discord Guild ID
const TARGET_ROLE_NAME = "Laukiantis Atsakymo"; // Role you are checking for
const COOKIE_API_KEY = process.env.COOKIE_API_KEY; // API key from .env (cookie API)

app.post("/api/check-role", async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        console.log(`Checking role for user: ${userId}`);
        
        // Make the API call to check the user's roles on Discord
        const response = await fetch("https://api.cookie-api.com/api/discord/user-info", {
            method: "POST",
            headers: {
                "Authorization": COOKIE_API_KEY, // Authorization header with your API key
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                bot_token: DISCORD_BOT_TOKEN,
                guild_id: GUILD_ID,
                user_id: userId
            })
        });

        // Check if the response is successful
        if (!response.ok) {
            throw new Error(`Failed to fetch user data from cookie API. Status: ${response.status} - ${response.statusText}`);
        }

        // Parse the response body
        const userData = await response.json();
        
        // Check if the user has the target role
        const hasRole = userData.roles.some(role => role.name === TARGET_ROLE_NAME);

        // Return the result to the client
        res.json({ hasRole });

    } catch (error) {
        // Log the error details to the console
        console.error("Error checking role:", error);
        
        // Return a 500 error with a descriptive message
        res.status(500).json({ error: `Internal server error: ${error.message}` });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
