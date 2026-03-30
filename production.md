# Bodhik Production Deployment Guide

This guide outlines the steps to deploy the **Bodhik** application to production using **Railway** for the Node.js backend and **Netlify** for the Next.js frontend.

## 1. Prepare Your Repository
Ensure your GitHub repository has the following structure with no clutter in the root (you should only have `frontend/` and `backend/` directories, alongside `.gitignore` and this file).

Commit and push all recent changes to your GitHub branch.

---

## 2. Deploying the Backend on Railway

Railway is a platform that automatically detects Node.js apps and deploy them seamlessly.

1. **Sign Up / Log In**: Go to [Railway.app](https://railway.app/) and log in with your GitHub account.
2. **New Project**:
   - Click **"New Project"**.
   - Select **"Deploy from GitHub repo"**.
   - Choose your repository.
3. **Configure Service**:
   - Railway might detect the root folder automatically. However, since the backend is in the `backend/` folder, you need to set the **Root Directory**.
   - Go to the deployed service **Settings** > **General** > **Root Directory** and set it to `/backend`.
   - Railway will now build and start the server using `npm run start` (or whatever is defined in `backend/package.json`).
4. **Environment Variables**:
   - Go to the **Variables** tab for the backend service.
   - Add the following variables (copy values from your `.env.production`):
     - `PORT`: `8080` (or leave default, Railway injects its own `PORT`)
     - `OPENAI_API_KEY`: `your_openai_api_key`
     - `GEMINI_API_KEY`: `your_gemini_api_key`
     - `JWT_SECRET`: `your_secure_random_string`
5. **Generate Domain**:
   - Go to **Settings** > **Networking**.
   - Click **Generate Domain**. This will be your backend URL (e.g., `https://bodhik-backend-production.up.railway.app`).
   - Copy this URL; you will need it for the frontend.

---

## 3. Deploying the Frontend on Netlify

Netlify is optimized for deploying frontend frameworks like Next.js.

1. **Sign Up / Log In**: Go to [Netlify.com](https://www.netlify.com/) and log in with GitHub.
2. **New Site**:
   - Go to your team dashboard and click **"Add new site"** > **"Import an existing project"**.
   - Connect to GitHub and select your repository.
3. **Configure Build Settings**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next` (Netlify usually detects Next.js automatically and uses its Essential Next.js plugin).
4. **Environment Variables**:
   - Scroll down to **Environment variables** (or add them before deploying).
   - Add:
     - `NEXT_PUBLIC_API_URL`: `<The Railway Domain you copied above>` (Make sure to remove any trailing slashes, e.g., `https://bodhik-backend-...).up.railway.app/api` if you appended `/api` in your frontend calls).
5. **Deploy**:
   - Click **"Deploy site"**.
   - Netlify will build your Next.js app and assign a domain (e.g., `https://bodhik-frontend.netlify.app`).
   - Once successfully published, click the link to verify the frontend works and communicates with the Railway backend!

---

> [!TIP]
> **Debugging**: If the frontend doesn't communicate with the backend, open the Browser DevTools (F12) > Network tab, and check if the API requests are pointing to the correct Railway URL instead of `localhost:5000`.
