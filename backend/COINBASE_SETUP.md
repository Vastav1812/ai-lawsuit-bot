# Coinbase Cloud API Setup

This application requires Coinbase Cloud API credentials to function properly.

## Setup Instructions

1. **Create a Coinbase Cloud Account**
   - Go to [Coinbase Cloud](https://cloud.coinbase.com/)
   - Sign up for an account if you don't have one

2. **Create a New Project**
   - In the Coinbase Cloud dashboard, create a new project
   - Note down your `projectId`

3. **Generate API Credentials**
   - In your project, go to the API Keys section
   - Create a new API key
   - Download the private key file

4. **Configure the Application**
   - Replace the placeholder values in `coinbase_cloud_api_key.json`:
     ```json
     {
       "name": "ai-lawsuit-bot",
       "privateKey": "YOUR_ACTUAL_PRIVATE_KEY_HERE",
       "projectId": "YOUR_ACTUAL_PROJECT_ID_HERE"
     }
     ```

5. **Security Notes**
   - Never commit the actual API key file to version control
   - The file is already added to `.gitignore`
   - Keep your private key secure and don't share it

## Testing the Setup

After configuring the credentials, you can test the setup by running:

```bash
docker-compose up --build
```

The backend should start successfully without the Coinbase configuration error.

## Troubleshooting

If you still see the "file not found" error:
1. Make sure the `coinbase_cloud_api_key.json` file exists in the `backend/` directory
2. Verify the file path in the Docker volume mount in `docker-compose.yml`
3. Check that the JSON format is correct
4. Ensure the file has the correct permissions 