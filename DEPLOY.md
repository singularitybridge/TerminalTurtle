# AI Agent Executor - Cloud Run Deployment

## Quick Deploy

1. Build and push to Google Container Registry:
```bash
export PROJECT_ID=your-project-id

# Build and push
gcloud builds submit --tag gcr.io/$PROJECT_ID/ai-agent-executor
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy ai-agent-executor \
  --image gcr.io/$PROJECT_ID/ai-agent-executor \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --port 8080 \
  --set-env-vars="NODE_ENV=production,WORKING_DIRECTORY=/data/workspace"
```

## Required Environment Variables

Configure in Cloud Run:
- `NODE_ENV`: Set to 'production'
- `PORT`: Default 8080
- `WORKING_DIRECTORY`: Set to '/data/workspace'

## Important Notes

1. File System: Cloud Run is stateless. Files written to the container filesystem are temporary.
   - Use Google Cloud Storage for persistent files
   - Or use a database for data persistence

2. Security:
   - Use Cloud Run's built-in authentication
   - Store sensitive env vars in Secret Manager
   - Implement rate limiting

3. Monitoring:
   - Enable Cloud Logging
   - Set up Cloud Monitoring
   - Configure error alerts
