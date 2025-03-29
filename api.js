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
const ROLE_IDS = {
  "narys": "1325853699087536228", // Update this with the actual Narys role ID
  "laukiantisAtsakymo": "1332046743675600928" // Update this with the actual Laukiantis Atsakymo role ID
};

// Handle OPTIONS preflight requests for all endpoints
app.options("/api/check-role/:roleType", cors());

// Reusable function to check Discord role
async function checkDiscordRole(userId, roleId) {
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
    throw { 
      status: response.status, 
      message: "Discord API request failed" 
    };
  }

  const userData = await response.json();
  return userData.roles.includes(roleId);
}

// Middleware to validate userId
function validateUserId(req, res, next) {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ 
      error: "User ID is required",
      receivedBody: req.body
    });
  }
  
  next();
}

// Generic error handler
function handleApiError(res, error) {
  console.error("Server Error:", error);
  const status = error.status || 500;
  res.status(status).json({ 
    error: error.message || "Internal server error", 
    details: error.details || error.message 
  });
}

// Narys role endpoint
app.post("/api/check-role/narys", validateUserId, async (req, res) => {
  console.log("Checking Narys role for user:", req.body.userId);
  
  try {
    const hasRole = await checkDiscordRole(req.body.userId, ROLE_IDS.narys);
    res.json({ hasRole });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Laukiantis Atsakymo role endpoint
app.post("/api/check-role/laukiantis-atsakymo", validateUserId, async (req, res) => {
  console.log("Checking Laukiantis Atsakymo role for user:", req.body.userId);
  
  try {
    const hasRole = await checkDiscordRole(req.body.userId, ROLE_IDS.laukiantisAtsakymo);
    res.json({ hasRole });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Parameterized role endpoint
app.post("/api/check-role", async (req, res) => {
  console.log("Received Request Body:", req.body);
  
  const { userId, roleType = "narys" } = req.body;
  
  if (!userId) {
    return res.status(400).json({ 
      error: "User ID is required",
      receivedBody: req.body
    });
  }
  
  // Validate role type
  const normalizedRoleType = roleType.toLowerCase().replace(/\s+/g, '');
  let roleId;
  
  if (normalizedRoleType === "narys" || normalizedRoleType === "member") {
    roleId = ROLE_IDS.narys;
  } else if (normalizedRoleType === "laukiantisatsakymo" || normalizedRoleType === "waitingforresponse") {
    roleId = ROLE_IDS.laukiantisAtsakymo;
  } else {
    return res.status(400).json({ 
      error: `Unknown role type: ${roleType}`,
      availableRoles: ["narys", "laukiantisAtsakymo"]
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
    const hasRole = userData.roles.includes(roleId);
    
    res.json({ 
      hasRole,
      roleChecked: roleType
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      details: error.message 
    });
  }
});

// Check both roles at once
app.post("/api/check-both-roles", validateUserId, async (req, res) => {
  const { userId } = req.body;
  
  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json"
      },
    });
    
    if (!response.ok) {
      return res.status(response.status).json({
        error: "Discord API request failed",
        status: response.status
      });
    }
    
    const userData = await response.json();
    const userRoles = userData.roles;
    
    res.json({ 
      isNarys: userRoles.includes(ROLE_IDS.narys),
      isLaukiantisAtsakymo: userRoles.includes(ROLE_IDS.laukiantisAtsakymo)
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
