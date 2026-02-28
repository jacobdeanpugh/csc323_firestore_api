const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Create Express app
const app = express();
app.use(express.json());

// ==========================================
// TODO: Implement your endpoints below
// ==========================================

// POST /users - Create or generate a username
app.post("/users", async (req, res) => {
  try {
    // TODO: Extract username from request body (or generate one)
    // TODO: Check if username already exists in 'users' collection
    // TODO: Create a new user document with username and created_at
    // TODO: Return the created user
    res.status(200).json({ message: "TODO: Implement POST /users" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /polls - Create a new poll
app.post("/polls", async (req, res) => {
  try {
    // TODO: Extract question, options, expiration_timestamp, creator_id from request
    // TODO: Validate inputs
    // TODO: Create a new poll document in 'polls' collection
    // TODO: Initialize total_votes to 0 and status to 'open'
    // TODO: Return the created poll with its ID
    res.status(200).json({ message: "TODO: Implement POST /polls" });
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /polls/{pollId}/vote - Cast a vote
app.post("/polls/:pollId/vote", async (req, res) => {
  try {
    const { pollId } = req.params;
    // TODO: Extract voter_id and option_selected from request body
    // TODO: Query 'votes' collection to check if this user already voted on this poll
    // TODO: If already voted, return error
    // TODO: If not, create a new vote document in 'votes' collection
    // TODO: Return success response
    res.status(200).json({ message: "TODO: Implement POST /polls/:pollId/vote" });
  } catch (error) {
    console.error("Error casting vote:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /polls/{pollId} - Retrieve current results for a specific poll
app.get("/polls/:pollId", async (req, res) => {
  try {
    const { pollId } = req.params;
    // TODO: Fetch the poll document from 'polls' collection
    // TODO: If poll doesn't exist, return 404
    // TODO: Query 'votes' collection to get vote counts per option
    // TODO: Return poll details with vote totals
    res.status(200).json({ message: "TODO: Implement GET /polls/:pollId" });
  } catch (error) {
    console.error("Error retrieving poll:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /polls - Retrieve user's polls expiring within 24 hours
app.get("/polls", async (req, res) => {
  try {
    const { owner, expiresBefore } = req.query;
    // TODO: Validate that both owner and expiresBefore are provided
    // TODO: Query 'polls' collection where creator_id == owner AND expiration_timestamp <= expiresBefore
    // TODO: NOTE: This query will require a composite index (Firestore will prompt you)
    // TODO: Return list of matching polls
    res.status(200).json({ message: "TODO: Implement GET /polls" });
  } catch (error) {
    console.error("Error retrieving polls:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /polls/{pollId} - Remove a poll
app.delete("/polls/:pollId", async (req, res) => {
  try {
    const { pollId } = req.params;
    // TODO: Extract the creator_id from request (to verify authorization)
    // TODO: Fetch the poll document
    // TODO: Check if the requesting user is the creator
    // TODO: If not creator, return 403 Forbidden
    // TODO: If creator, delete the poll document
    // TODO: Return success response
    res.status(200).json({ message: "TODO: Implement DELETE /polls/:pollId" });
  } catch (error) {
    console.error("Error deleting poll:", error);
    res.status(500).json({ error: error.message });
  }
});

// Export the function
exports.pollingAPI = functions.https.onRequest(app);
