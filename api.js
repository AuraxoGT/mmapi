require('dotenv').config();  // Ensure this is included to load environment variables
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: '*', // Be more specific in production
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const DISCORD_BOT_TOKEN = process.env.TOKEN; // Your bot token from .env
const GUILD_ID = "1325850250027597845"; // Your Discord Guild ID
const TARGET_ROLE_ID = "1332046743675600928"; // Role ID for "Laukiantis Atsakymo"

app.post("/api/check-role", async (req, res) => {
    const { userId } = req.body;
    
    // Validate input more thoroughly
    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: "Valid User ID is required" });
    }

    try {
        // Fetch user data from Discord API
        const response = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
                "Content-Type": "application/json"
            },
        });

        // Log full response for debugging
        console.log('Discord API Response Status:', response.status);

        // Handle specific status codes
        if (response.status === 401) {
            return res.status(401).json({ error: "Unauthorized: Invalid Bot Token" });
        }

        if (response.status === 403) {
            return res.status(403).json({ error: "Forbidden: Bot lacks necessary permissions" });
        }

        if (response.status === 404) {
            return res.status(404).json({ error: "User not found in guild" });
        }

        if (!response.ok) {
            throw new Error(`Discord API error. Status: ${response.status}`);
        }

        // Parse the response data
        const userData = await response.json();

        // Check if the user has the target role by ID
        const hasRole = userData.roles.includes(TARGET_ROLE_ID);

        // Send the result back to the client
        res.json({ hasRole });

    } catch (error) {
        console.error("Comprehensive Error Details:", {
            message: error.message,
            name: error.name,
            stack: error.stack
        });

        res.status(500).json({ 
            error: "Internal server error", 
            details: error.message 
        });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
