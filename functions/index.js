// Initialize Firebase Admin once
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const express = require("express");

admin.initializeApp();
const db = admin.firestore();

// Create Express app for pollingAPI
const app = express();
app.use(express.json());

// ==========================================
// Import all endpoints from pollingAPI
// ==========================================

// POST /users - Create or generate a username
app.post("/users", async (req, res) => {
  try {
    const username = req.body.username || "user_" + Math.random().toString(36).substring(2, 8);
    const existingUser = await db.collection("users").where("username", "==", username).get();
    if (!existingUser.empty) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const newUser = {
      username: username,
      created_at: new Date().toISOString()
    };
    const userRef = await db.collection("users").add(newUser);

    res.status(200).json({ ...newUser, id: userRef.id });

  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /polls - Create a new poll
app.post("/polls", async (req, res) => {
  try {
    const question = req.body.question
    const options = req.body.options
    const expiration_time = req.body.expiration_time
    const creator_id = req.body.creator_id

    if(!question || !options || !expiration_time || !creator_id) {
      return res.status(400).json({error: "Missing Fields"});
    }

    if(!(question.length > 0)) {
      return res.status(400).json({error: "Question cannot be empty"});
    }

    if(Object.keys(options).length < 2) {
      return res.status(400).json({error: "At least 2 options are required"});
    }

    const newPoll = {
      question: question,
      options_map: options,
      expiration_timestamp: expiration_time,
      creator_id: creator_id,
      total_votes: 0,
      status: 'open',
      created_at: new Date().toISOString()
    }

    const pollRef = await db.collection("polls").add(newPoll);

    res.status(201).json({ ...newPoll, id: pollRef.id });
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /polls/{pollId}/vote - Cast a vote
app.post("/polls/:pollId/vote", async (req, res) => {
  try {
    const { pollId } = req.params;
    const { voter_id, option_selected } = req.body;

     if(!voter_id || !option_selected) {
      return res.status(400).json({error: "Missing Fields"});
    }

    // Check if user exists if not return 404
    const userDoc = await db.collection("users").doc(voter_id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if poll exists and is open
    const pollDoc = await db.collection("polls").doc(pollId).get();
    if (!pollDoc.exists) {
      return res.status(404).json({ error: "Poll not found" });
    }

    const pollData = pollDoc.data();
    if (pollData.status !== 'open' || new Date(pollData.expiration_timestamp) < new Date()) {
      return res.status(400).json({ error: "Poll is closed" });
    }

    const existingVote = await db.collection("votes").where("poll_id", "==", pollId).where("voter_id", "==", voter_id).get();
    if (!existingVote.empty) {
      return res.status(409).json({ error: "User has already voted on this poll" });
    }

    const newVote = {
      poll_id: pollId,
      voter_id: voter_id,
      option_selected: option_selected,
      timestamp: new Date().toISOString()
    };

    await db.collection("votes").add(newVote);

    // Update the total votes count in the poll document
    const pollRef = db.collection("polls").doc(pollId);
    await pollRef.update({
      total_votes: admin.firestore.FieldValue.increment(1)
    });

    res.status(200).json({ message: "Vote cast successfully" });
  } catch (error) {
    console.error("Error casting vote:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /polls/{pollId} - Retrieve current results for a specific poll
app.get("/polls/:pollId", async (req, res) => {
  try {
    const { pollId } = req.params;

    const pollDoc = await db.collection("polls").doc(pollId).get();

     if (!pollDoc.exists) {
      return res.status(404).json({ error: "Poll not found" });
    }
    const pollData = pollDoc.data();

    const votesQuery = db.collection("votes").where("poll_id", "==", pollId);
    const votesSnapshot = await votesQuery.get();
    const voteCounts = {};
    votesSnapshot.forEach(doc => {
      const voteData = doc.data();
      voteCounts[voteData.option_selected] = (voteCounts[voteData.option_selected] || 0) + 1;
    });

    res.status(200).json({ ...pollData, vote_counts: voteCounts });
  } catch (error) {
    console.error("Error retrieving poll:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /polls - Retrieve user's polls expiring within 24 hours
app.get("/polls", async (req, res) => {
  try {
    const { owner, expiresBefore } = req.query;

    if(!owner || !expiresBefore) {
      return res.status(400).json({error: "Missing query parameters: owner and expiresBefore are required"});
    }

    const pollDocs = await db.collection("polls")
      .where("creator_id", "==", owner)
      .where("expiration_timestamp", "<=", expiresBefore)
      .get();

    const polls = [];
    pollDocs.forEach(doc => {
      polls.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({ polls });

  } catch (error) {
    console.error("Error retrieving polls:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /polls/{pollId} - Remove a poll
app.delete("/polls/:pollId", async (req, res) => {
  try {
    const { pollId } = req.params;

    const creator_id = req.body.creator_id;

    if(!creator_id) {
      return res.status(400).json({error: "Missing creator_id in request body"});
    }

    const pollDoc = await db.collection("polls").doc(pollId).get();
    if (!pollDoc.exists) {
      return res.status(404).json({ error: "Poll not found" });
    }

    const pollData = pollDoc.data();
    if (pollData.creator_id !== creator_id) {
      return res.status(403).json({ error: "Forbidden: You are not the creator of this poll" });
    }

    await db.collection("polls").doc(pollId).delete();

    res.status(200).json({ message: "Poll deleted successfully" });

  } catch (error) {
    console.error("Error deleting poll:", error);
    res.status(500).json({ error: error.message });
  }
});

// Export the pollingAPI function
exports.pollingAPI = functions.https.onRequest(app);
