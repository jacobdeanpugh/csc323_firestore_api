const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// ==========================================
// TODO: Implement vote processing logic
// ==========================================

// Firestore Trigger: Fires when a new document is created in the 'votes' collection
exports.voteCounter = functions.firestore
  .document("votes/{voteId}")
  .onCreate(async (snap, context) => {
    try {
      const voteData = snap.data();
      const { voter_id, poll_id, option_selected, timestamp } = voteData;

      console.log(`Processing vote: ${context.params.voteId}`);
      console.log(`Vote data:`, voteData);

      // TODO: Fetch the poll document from 'polls' collection using poll_id
      // TODO: Check if the poll has expired by comparing expiration_timestamp with current time

      // TODO: If poll is expired:
      //   - Update the poll document: set status to 'closed'
      //   - Do NOT increment total_votes
      //   - Delete the vote document that was just created (or mark it invalid)
      //   - Return early

      // TODO: If poll is NOT expired:
      //   - Increment the total_votes count in the poll document by 1
      //   - Update the poll document status to 'open' (or keep it as is)
      //   - Log successful vote processing

      console.log(`Vote processed successfully for poll: ${poll_id}`);
    } catch (error) {
      console.error("Error processing vote:", error);
      throw error; // Re-throw to mark function as failed
    }
  });
