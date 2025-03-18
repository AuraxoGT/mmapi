require('dotenv').config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();

app.use(cors());
app.use(express.json());

const DISCORD_BOT_TOKEN = process.env.TOKEN;
const GUILD_ID = "1325850250027597845";
const TARGET_ROLE_ID = "1332046743675600928";
const cache = new Map();

// Rate limiter configuration
const RATE_LIMIT = {
    maxRetries: 5,
    baseDelay: 1000,
    cacheTTL: 60000 // 1 minute
};

async function fetchWithRetry(url, options, retries = RATE_LIMIT.maxRetries) {
    let attempt = 0;
    
    while (attempt <= retries) {
        try {
            const response = await fetch(url, options);
            
            // Handle rate limits
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After') || 
                    Math.min(RATE_LIMIT.baseDelay * Math.pow(2, attempt), 30000);
                
                console.warn(`Rate limited. Retrying in ${retryAfter}ms`);
                await new Promise(resolve => setTimeout(resolve, retryAfter));
                attempt++;
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
        } catch (error) {
            if (attempt >= retries) throw error;
            attempt++;
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.baseDelay));
        }
    }
}

app.post("/api/check-role", async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    // Check cache first
    if (cache.has(userId)) {
        const { data, timestamp } = cache.get(userId);
        if (Date.now() - timestamp < RATE_LIMIT.cacheTTL) {
            return res.json(data);
        }
    }

    try {
        const response = await fetchWithRetry(
            `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`,
            {
                method: "GET",
                headers: { "Authorization": `Bot ${DISCORD_BOT_TOKEN}` }
            }
        );

        const userData = await response.json();
        const result = { hasRole: userData.roles.includes(TARGET_ROLE_ID) };

        // Update cache
        cache.set(userId, { 
            data: result, 
            timestamp: Date.now() 
        });

        res.json(result);

    } catch (error) {
        console.error("Error checking role:", error);
        const status = error.message.startsWith("HTTP") ? 
            parseInt(error.message.split(" ")[1]) : 500;
        
        // Log rate limit headers if available
        if (error.response) {
            console.log('Rate Limit Headers:', {
                'Retry-After': error.response.headers.get('Retry-After'),
                'X-RateLimit-Limit': error.response.headers.get('X-RateLimit-Limit'),
                'X-RateLimit-Remaining': error.response.headers.get('X-RateLimit-Remaining'),
                'X-RateLimit-Reset': error.response.headers.get('X-RateLimit-Reset'),
                'X-RateLimit-Bucket': error.response.headers.get('X-RateLimit-Bucket')
            });
        }

        res.status(status).json({ 
            error: error.message,
            retryable: status === 429
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Rate limit configuration:", RATE_LIMIT);
});
