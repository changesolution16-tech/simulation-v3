# Netlify Deployment Guide

Your application has been built and is ready to deploy to Netlify!

## Step 1: Manual Deploy to Netlify

1. **Log into your Netlify account** at https://app.netlify.com

2. **Find the Deploy Section:**
   - Look for "Add new site" button or "Sites" tab
   - Click "Deploy manually" or look for the drag-and-drop area
   - You should see: "Want to deploy a new site without connecting to Git?"

3. **Deploy the dist folder:**
   - Locate the `dist` folder in your project directory
   - Drag the entire `dist` folder into Netlify's drag-and-drop area
   - Wait 30-60 seconds for the upload to complete

4. **Your site is live!**
   - Netlify will give you a temporary URL like: `https://random-name-123.netlify.app`
   - Test this URL to make sure the site loads

## Step 2: Configure Environment Variables

**CRITICAL:** Your app won't work properly without these environment variables!

1. **In Netlify Dashboard:**
   - Click on your newly deployed site
   - Go to "Site settings" or "Site configuration"
   - Find "Environment variables" section (usually under "Build & deploy")

2. **Add these two variables:**

   **Variable 1:**
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://gglzmggwifbkxtxjclcw.supabase.co`

   **Variable 2:**
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnbHptZ2d3aWZia3h0eGpjbGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzQwNDYsImV4cCI6MjA3NjcxMDA0Nn0.N1RXMKEc9KeTVWoljsKZEzgcO6avl8VhpNG1xULf0xg`

3. **Trigger a redeploy:**
   - Go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"
   - Wait for the new deployment to finish (1-2 minutes)

## Step 3: Add Custom Domain

1. **In Netlify Dashboard:**
   - Go to "Domain settings" or "Domain management"
   - Click "Add custom domain" or "Add domain alias"
   - Enter: `simulation.changesolutionshub.com`
   - Click "Verify" or "Add domain"

2. **Netlify will provide DNS instructions:**
   - It will show you a CNAME record target (usually something like `your-site.netlify.app`)
   - **Copy this CNAME target** - you'll need it for the next step

## Step 4: Configure DNS in Your Domain Provider

You need to add a CNAME record in your domain provider (wherever you manage changesolutionshub.com):

1. **Log into your domain provider** (Bolt or wherever you registered the domain)
2. **Find DNS settings** or "DNS records" or "DNS management"
3. **Add a new CNAME record:**
   - Type: `CNAME`
   - Name/Host: `simulation`
   - Target/Value: [the CNAME value Netlify gave you]
   - TTL: Auto or 3600

4. **Save the DNS record**

## Step 5: Update Supabase Configuration

1. **Log into Supabase** at https://supabase.com
2. **Go to your project** (gglzmggwifbkxtxjclcw)
3. **Navigate to:** Authentication → URL Configuration
4. **Add these URLs:**
   - Site URL: `https://simulation.changesolutionshub.com`
   - Redirect URLs: `https://simulation.changesolutionshub.com/**`
5. **Save changes**

## Step 6: Wait and Test

1. **DNS Propagation:** Wait 5-60 minutes for DNS changes to propagate worldwide
2. **SSL Certificate:** Netlify will automatically provision an SSL certificate (5-10 minutes)
3. **Test your site:**
   - Visit: `https://simulation.changesolutionshub.com`
   - Try logging in with test credentials
   - Verify simulations work correctly
   - Check that data saves properly

## Troubleshooting

**If the site shows a blank page:**
- Check that environment variables are set correctly in Netlify
- Make sure you triggered a redeploy after adding environment variables

**If "simulation.changesolutionshub.com" doesn't work:**
- Verify the CNAME record in your DNS settings
- Wait longer for DNS propagation (can take up to 24 hours)
- Check Netlify's domain settings for any error messages

**If login doesn't work:**
- Verify Supabase URL configuration includes your custom domain
- Check browser console for any error messages

## Need Help?

If you encounter any issues, let me know and I can help troubleshoot!

---

**Current Status:**
✅ Project built successfully
✅ dist folder ready for deployment
⏳ Waiting for you to upload to Netlify
⏳ Configure environment variables
⏳ Add custom domain
⏳ Configure DNS
⏳ Update Supabase settings
