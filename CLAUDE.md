# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Firestore-based Polling API** for CSC323 (Cloud Computing) Homework 5. The system is a serverless architecture with two decoupled services:

1. **Polling API (HTTP Cloud Function)** - Public REST endpoints for user/poll/vote operations
2. **Vote Counter (Firestore Trigger)** - Background function that processes votes and updates aggregates

### Key Architecture Concepts

- **Event-Driven Design**: The trigger function fires automatically when new vote documents are created, decoupling the API from vote processing
- **Duplicate Prevention**: The API must query Firestore before allowing votes to prevent the same user from voting twice
- **Poll Expiration**: Handled by the trigger function which checks timestamps and marks polls as closed when expired
- **Service Account Separation**: Two separate service accounts with minimal permissions (`hw-5-api-agent` and `hw-5-trigger-agent`)

### Data Structure

Three main Firestore collections:
- **users**: username, created_at
- **polls**: question, options_map, creator_id, total_votes, status (open/closed), expiration_timestamp
- **votes**: voter_id, poll_id, option_selected, timestamp

Note: When the first query requiring an index runs, Firestore will provide an index creation link in the error message.

## Development Workflow

### Local Development & Testing

For testing HTTP functions locally, use the Firebase Emulator Suite:

```bash
# Start the Firestore and Functions emulators
firebase emulators:start

# In another terminal, run tests against the local endpoints
# The API function will typically run on http://localhost:5001/{PROJECT_ID}/us-central1/pollingAPI
```

### Deployment to Google Cloud

```bash
# Deploy the HTTP function
gcloud functions deploy pollingAPI \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --service-account hw-5-api-agent@{PROJECT_ID}.iam.gserviceaccount.com

# Deploy the Firestore trigger function
gcloud functions deploy voteCounter \
  --runtime nodejs18 \
  --trigger-resource votes \
  --trigger-event providers/cloud.firestore/eventTypes/document.create \
  --service-account hw-5-trigger-agent@{PROJECT_ID}.iam.gserviceaccount.com
```

### Testing Endpoints

All 5 endpoints must be tested:
1. `POST /users` - Create/generate username
2. `POST /polls` - Create a poll
3. `POST /polls/{pollId}/vote` - Cast a vote
4. `GET /polls/{pollId}` - Retrieve poll results
5. `GET /polls?owner={userId}&expiresBefore={timestamp}` - List user's expiring polls
6. `DELETE /polls/{pollId}` - Delete a poll (authorization check needed)

Use tools like Postman, curl, or Thunder Client to test these endpoints.

## Important Implementation Details

### Query Optimization & Indexing

- The query `GET /polls?owner={userId}&expiresBefore={timestamp}` requires a **composite index** on the polls collection with fields: `creator_id` and `expiration_timestamp`
- When you run this query for the first time, Firestore will return an error with a link to create the index automatically
- Do not manually create indexes unless necessary; let Firestore guide you

### Duplicate Vote Prevention

- The vote endpoint must **query the votes collection first** to check if the user has already voted on that poll
- Query structure: `votes where voter_id == X AND poll_id == Y`
- This check should happen in the API function before writing the vote to Firestore

### Poll Expiration Logic

- The trigger function receives event data when a new vote is created
- Extract the poll document and check `expiration_timestamp` against the current time
- If expired, mark the poll as closed and reject the vote (don't increment total_votes)
- If within the expiration window, increment total_votes and write the vote

### Service Account Permissions

The assignment requires discussing your permission choices:
- **hw-5-api-agent**: Needs read/write access to all collections (users, polls, votes)
- **hw-5-trigger-agent**: Needs write access to polls collection only (to update total_votes and status)

Document why this separation reduces risk (principle of least privilege).

## Project Structure (Once Implemented)

```
functions/
  ├── pollingAPI/
  │   ├── index.js         # Main HTTP function with route handlers
  │   └── package.json
  └── voteCounter/
      ├── index.js         # Firestore trigger function
      └── package.json

firestore.rules              # Security rules for collections
firebase.json               # Firebase configuration
CLAUDE.md                   # This file
homework 5.pdf             # Assignment specification
```

## Key Dependencies

- **firebase-functions**: Provides HTTP and Firestore trigger decorators
- **firebase-admin**: For Firestore database access
- **express**: Optional, for cleaner HTTP routing (if using it)

## Common Debugging

### Index Creation Errors
When running queries with filters/ordering for the first time, Firestore returns an error with an index creation link. Click it or use Firebase Console to create the index, then retry.

### Timestamp Handling
Use ISO 8601 format (`new Date().toISOString()`) for consistency in Firestore. When comparing in the trigger, convert Firestore timestamps to JavaScript Date objects.

### Trigger Function Not Firing
- Ensure the trigger function is listening to the correct collection (`votes`)
- Verify the service account has write permissions to the polls collection
- Check Cloud Logging in the Google Cloud Console for errors

## Extra Credit: Anonymous Voting

The challenge allows voting without a userId by tracking the client's IP address instead:
- Extract client IP from the request headers (e.g., `x-forwarded-for`)
- Use IP as a unique identifier in the votes collection
- Same duplicate prevention logic applies

## Notes

- This is an educational project demonstrating serverless architecture and event-driven design
- Focus on understanding the decoupling between the API and trigger functions
- Proper error handling (authorization, validation) is essential for all endpoints
- A 3-5 minute video demonstrating all endpoints is required for submission
