# Subdomain Deployment Guide
## Deploying to simulation.changesolutionshub.com

This guide provides step-by-step instructions for deploying the Moodle Soft Skills Simulation application as a subdomain while maintaining your existing application on the main domain.

---

## Prerequisites

- Access to DNS management for changesolutionshub.com domain
- A hosting platform account (Vercel, Netlify, or Cloudflare Pages recommended)
- Access to your Supabase project dashboard
- Git repository with this codebase

---

## Step 1: Choose Your Hosting Platform

This application is configured to work with multiple hosting platforms. Choose one:

### Option A: Vercel (Recommended)
- Excellent performance and CDN
- Automatic SSL certificates
- Easy custom domain setup
- Free tier available

### Option B: Netlify
- User-friendly interface
- Automatic deployments
- Built-in form handling
- Free tier available

### Option C: Cloudflare Pages
- Global CDN with excellent performance
- Integrated with Cloudflare DNS (if using)
- Free tier available

---

## Step 2: Deploy to Your Chosen Platform

### For Vercel:

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Configure build settings (Vercel will auto-detect from vercel.json):
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`: `https://gglzmggwifbkxtxjclcw.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: (copy from your .env file)
6. Click "Deploy"
7. Wait for the initial deployment to complete

### For Netlify:

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" > "Import an existing project"
3. Connect your Git repository
4. Configure build settings (Netlify will auto-detect from netlify.toml):
   - Build Command: `npm run build`
   - Publish Directory: `dist`
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`: `https://gglzmggwifbkxtxjclcw.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: (copy from your .env file)
6. Click "Deploy"
7. Wait for the initial deployment to complete

### For Cloudflare Pages:

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com) and sign in
2. Click "Create a project"
3. Connect your Git repository
4. Configure build settings:
   - Framework preset: `Vite`
   - Build Command: `npm run build`
   - Build output directory: `dist`
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`: `https://gglzmggwifbkxtxjclcw.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: (copy from your .env file)
6. Click "Save and Deploy"
7. Wait for the initial deployment to complete

---

## Step 3: Configure Custom Domain

### For Vercel:

1. In your Vercel project, go to "Settings" > "Domains"
2. Click "Add Domain"
3. Enter: `simulation.changesolutionshub.com`
4. Click "Add"
5. Vercel will provide DNS configuration instructions
6. Note the CNAME target (typically: `cname.vercel-dns.com`)

### For Netlify:

1. In your Netlify site, go to "Domain settings"
2. Click "Add custom domain"
3. Enter: `simulation.changesolutionshub.com`
4. Click "Verify"
5. Note the provided DNS target (typically ends with `.netlify.app`)

### For Cloudflare Pages:

1. In your Pages project, go to "Custom domains"
2. Click "Set up a custom domain"
3. Enter: `simulation.changesolutionshub.com`
4. Follow the DNS configuration instructions
5. If using Cloudflare DNS, it will configure automatically

---

## Step 4: Configure DNS Records

Access your DNS management panel for changesolutionshub.com and add the following record:

**CNAME Record:**
- Name/Host: `simulation`
- Type: `CNAME`
- Value/Target: (the target provided by your hosting platform from Step 3)
- TTL: `Auto` or `3600` (1 hour)

### Example DNS Configuration:

```
Type    Name        Value                           TTL
CNAME   simulation  cname.vercel-dns.com           3600
```

**Note:** DNS propagation can take 5-60 minutes. Use [whatsmydns.net](https://www.whatsmydns.net) to check propagation status.

---

## Step 5: Configure Supabase for Subdomain

You need to update your Supabase project settings to allow authentication from the new subdomain.

1. Go to your Supabase project dashboard: [https://supabase.com/dashboard/project/gglzmggwifbkxtxjclcw](https://supabase.com/dashboard/project/gglzmggwifbkxtxjclcw)

2. Navigate to **Authentication** > **URL Configuration**

3. Add the following to **Site URL** (if not already set):
   ```
   https://simulation.changesolutionshub.com
   ```

4. Add the following to **Redirect URLs** (add all that apply):
   ```
   https://simulation.changesolutionshub.com
   https://simulation.changesolutionshub.com/login
   https://simulation.changesolutionshub.com/reset-password
   https://simulation.changesolutionshub.com/dashboard
   https://simulation.changesolutionshub.com/**
   ```

5. Navigate to **Settings** > **API**

6. Verify that **CORS** settings allow requests from your subdomain. If there's a CORS configuration section, add:
   ```
   https://simulation.changesolutionshub.com
   ```

7. Click **Save** to apply changes

---

## Step 6: Enable SSL/HTTPS

Most modern hosting platforms automatically provision SSL certificates:

### Vercel:
- SSL is automatic once DNS is configured
- Certificate typically provisions within 60 seconds
- No action required

### Netlify:
- Go to "Domain settings" > "HTTPS"
- Click "Verify DNS configuration"
- Click "Provision certificate"
- Wait for certificate to be issued (usually under 1 minute)

### Cloudflare Pages:
- SSL is automatic with Cloudflare
- Ensure SSL/TLS mode is set to "Full" or "Full (strict)" in Cloudflare dashboard
- No additional action required

---

## Step 7: Test Your Deployment

Once DNS has propagated and SSL is configured:

1. Visit: `https://simulation.changesolutionshub.com`
2. Verify the login page loads correctly
3. Test user authentication:
   - Log in with existing credentials
   - Verify redirect after login works
   - Check that protected routes are accessible
4. Test a complete simulation flow:
   - Navigate to learner dashboard
   - Start a simulation
   - Complete at least one scenario
   - Verify data persistence
5. Test admin features (if applicable):
   - Access admin dashboard
   - Verify all admin tools load correctly

### Common Issues and Solutions:

**Issue: "Site can't be reached" or DNS errors**
- Solution: Wait for DNS propagation (5-60 minutes)
- Check DNS records are configured correctly
- Use `nslookup simulation.changesolutionshub.com` to verify

**Issue: SSL certificate errors**
- Solution: Wait a few minutes for certificate provisioning
- Verify DNS is pointing correctly
- Check hosting platform's SSL status

**Issue: Authentication redirects fail**
- Solution: Verify Supabase redirect URLs are configured correctly
- Check that all URLs use HTTPS
- Clear browser cache and cookies

**Issue: "CORS policy" errors in browser console**
- Solution: Add subdomain to Supabase CORS settings
- Verify environment variables are set correctly
- Redeploy after changing environment variables

**Issue: Application loads but shows blank page**
- Solution: Check browser console for errors
- Verify environment variables are set correctly
- Ensure build completed successfully

---

## Step 8: Set Up Continuous Deployment

Configure automatic deployments when you push code changes:

### For Vercel:
- Automatic by default
- Every push to main branch triggers deployment
- Configure branch deployments in Settings > Git

### For Netlify:
- Automatic by default
- Every push to main branch triggers deployment
- Configure in Site settings > Build & deploy

### For Cloudflare Pages:
- Automatic by default
- Configure production branch in Settings
- Preview deployments available for all branches

---

## Step 9: Monitor and Maintain

### Set Up Monitoring:

1. **Performance Monitoring:**
   - Use your hosting platform's built-in analytics
   - Monitor page load times and build success rates

2. **Error Tracking:**
   - Check deployment logs regularly
   - Monitor browser console for client-side errors

3. **Database Monitoring:**
   - Monitor Supabase dashboard for query performance
   - Check for rate limiting or connection issues

### Regular Maintenance:

- Keep dependencies updated
- Monitor build times and optimize if needed
- Review and rotate access keys periodically
- Back up Supabase database regularly

---

## Architecture Overview

```
changesolutionshub.com (Main Domain)
├── [Your existing application]
│
└── simulation.changesolutionshub.com (Subdomain)
    ├── React SPA (Vite)
    ├── Supabase Backend
    │   ├── Authentication
    │   ├── Database (PostgreSQL)
    │   └── Storage
    └── Hosting Platform CDN
```

---

## Environment Variables Reference

Required environment variables for deployment:

```env
VITE_SUPABASE_URL=https://gglzmggwifbkxtxjclcw.supabase.co
VITE_SUPABASE_ANON_KEY=[Your Supabase Anonymous Key]
```

**Security Note:** The anonymous key is safe to expose in client-side code. Supabase Row Level Security (RLS) policies protect your data.

---

## Rollback Strategy

If you need to rollback to a previous version:

### Vercel:
1. Go to "Deployments"
2. Find the previous successful deployment
3. Click the three dots menu
4. Select "Promote to Production"

### Netlify:
1. Go to "Deploys"
2. Find the previous deploy
3. Click "Publish deploy"

### Cloudflare Pages:
1. Go to deployment history
2. Select previous deployment
3. Click "Rollback to this deployment"

---

## Support and Troubleshooting

If you encounter issues not covered in this guide:

1. Check the hosting platform's status page
2. Review Supabase project logs
3. Check browser console for client-side errors
4. Verify environment variables are set correctly
5. Ensure DNS records are configured properly

---

## Summary Checklist

- [ ] Deploy application to hosting platform
- [ ] Configure custom domain in hosting platform
- [ ] Add CNAME DNS record for subdomain
- [ ] Wait for DNS propagation
- [ ] Configure Supabase redirect URLs
- [ ] Verify SSL certificate is active
- [ ] Test authentication flow
- [ ] Test complete simulation flow
- [ ] Set up continuous deployment
- [ ] Configure monitoring and alerts

---

## Next Steps

Once your subdomain is live:

1. Update any documentation with the new URL
2. Notify users of the new subdomain
3. Consider setting up monitoring and analytics
4. Plan for regular maintenance and updates

Your Moodle Soft Skills Simulation application is now successfully deployed as a subdomain!
