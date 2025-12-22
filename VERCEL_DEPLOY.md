# Vercel Deployment Guide

This guide will help you deploy your Christmas Game Night app to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com) - free)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Your Firebase environment variables ready

## Quick Deploy (Recommended)

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Go to [vercel.com](https://vercel.com) and sign in**

3. **Click "Add New Project"**

4. **Import your Git repository**

5. **Configure the project:**
   - Framework Preset: **Next.js** (should auto-detect)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default - Vercel handles this)

6. **Add Environment Variables:**
   Click "Environment Variables" and add all the variables from your `.env` file:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `OPENAI_API_KEY` (if you use OpenAI features)
   - Any other environment variables your app needs

7. **Click "Deploy"**

8. **Wait for deployment to complete** (usually 1-2 minutes)

9. **Your app will be live!** 🎉

### Option 2: Deploy via CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Link to existing project? No (first time)
   - What's your project's name? `christmas-game-night` (or your choice)
   - In which directory is your code located? `./`
   - Want to override the settings? No (use defaults)

5. **Add environment variables:**
   ```bash
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
   # Paste your value when prompted
   # Repeat for all environment variables
   ```

6. **Deploy to production:**
   ```bash
   vercel --prod
   ```

## Environment Variables Setup

Make sure to add ALL your Firebase environment variables in Vercel:

1. Go to your project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - Variable name (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - Value (paste from your `.env` file)
   - Environments: Select **Production**, **Preview**, and **Development**

## Important Notes

- **Firebase configuration**: Your Firebase config is already set up in the codebase - just need to add the env vars in Vercel
- **Build settings**: Vercel auto-detects Next.js, so no special config needed
- **Custom domain**: After deployment, you can add a custom domain in Vercel settings
- **Automatic deployments**: Once connected to Git, every push to your main branch will auto-deploy

## Troubleshooting

### Build fails?

1. Check the build logs in Vercel dashboard
2. Make sure all environment variables are set
3. Run `npm run build` locally to test
4. Check that your TypeScript compiles: `npm run build`

### Environment variables not working?

1. Make sure variable names match exactly (case-sensitive)
2. Variables starting with `NEXT_PUBLIC_` are exposed to the browser
3. Redeploy after adding new environment variables
4. Check Vercel dashboard → Settings → Environment Variables

### Firebase connection issues?

1. Verify Firebase project settings match your environment variables
2. Check Firebase Console → Project Settings → General
3. Make sure Firestore rules allow your app
4. Verify authentication is enabled in Firebase Console

## Post-Deployment

After deployment:

1. **Test your app** - Visit the Vercel URL provided
2. **Update Firebase settings** (if needed):
   - Add your Vercel domain to authorized domains in Firebase Console
   - Update OAuth redirect URLs if using social auth
3. **Monitor deployments** - Check Vercel dashboard for deployment status
4. **Set up custom domain** (optional) - Add your domain in Vercel settings

## Continuous Deployment

Once set up:
- Every push to your main branch = automatic production deploy
- Pull requests = preview deployments
- You can trigger manual deployments from the dashboard

That's it! Your app should be live on Vercel. 🚀




