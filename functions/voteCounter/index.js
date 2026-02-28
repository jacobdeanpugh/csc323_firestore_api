const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Firestore Trigger: Fires when a new document is created in the 'votes' collection
exports.voteCounter = functions.firestore
  .document("votes/{voteId}")
  .onCreate(async (snap, context) => {
    try {
      const voteData = snap.data();
      const { voter_id, poll_id, option_selected, timestamp } = voteData;

      console.log(`Processing vote: ${context.params.voteId}`);
      console.log(`Vote data:`, voteData);

      const pollRef = db.collection("polls").doc(poll_id);
      const pollDoc = await pollRef.get();

      if (!pollDoc.exists) {
        console.error(`Poll not found for poll_id: ${poll_id}`);
        return; 
      }
     
      const pollData = pollDoc.data();
      const isExpired = new Date() > new Date(pollData.expiration_timestamp);


      if (isExpired) {
        console.log(`Poll has expired for poll_id: ${poll_id}`);

        const updatedPollData = {
          status: 'closed'
        };

        await pollRef.update(updatedPollData);

        console.log(`Poll status updated to 'closed' for poll_id: ${poll_id}`);

        await db.collection("votes").doc(context.params.voteId).delete();

        console.log(`Vote document deleted for voteId: ${context.params.voteId} due to expired poll`);

        return;
      } else {
        console.log(`Poll is still open for poll_id: ${poll_id}`);

        // Increment total_votes count in the poll document
        const updatedPollData = {
          total_votes: admin.firestore.FieldValue.increment(1)
        };

        await pollRef.update(updatedPollData);
        console.log(`Total votes count incremented for poll_id: ${poll_id}`);
      }

      console.log(`Vote processed successfully for poll: ${poll_id}`);
    } catch (error) {
      console.error("Error processing vote:", error);
      throw error; // Re-throw to mark function as failed
    }
  });
