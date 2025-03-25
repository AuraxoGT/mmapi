require('dotenv').config();
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

const DISCORD_BOT_TOKEN = process.env.TOKEN;
const GUILD_ID = "1325850250027597845";
const TARGET_ROLE_ID = "1332046743675600928";

// Handle OPTIONS preflight request
app.options("/api/check-role", cors());

// Handle POST request
app.post("/api/check-role", async (req, res) => {
    console.log("Received Request Body:", req.body);
    console.log("Request Headers:", req.headers);

    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ 
            error: "User ID is required",
            receivedBody: req.body
        });
    }

    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
                "Content-Type": "application/json"
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Discord API Error:", {
                status: response.status,
                body: errorText
            });

            return res.status(response.status).json({
                error: "Discord API request failed",
                status: response.status
            });
        }

        const userData = await response.json();
        const hasRole = userData.roles.includes(TARGET_ROLE_ID);
        
        res.json({ hasRole });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ 
            error: "Internal server error", 
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
