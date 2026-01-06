# Quick Deploy to simulation.changesolutionshub.com

This is a condensed guide for quickly deploying your application to the subdomain.

## Prerequisites
- Git repository pushed to GitHub/GitLab/Bitbucket
- Domain access for changesolutionshub.com

---

## Option 1: Deploy with Vercel (Fastest)

### 1. Deploy Application
```bash
# If you don't have Vercel CLI installed:
npm i -g vercel

# Login and deploy:
vercel login
vercel
```

Follow the prompts:
- Link to existing project? **No**
- Project name? **moodle-simulation** (or your choice)
- Which directory? **.** (current directory)
- Want to override settings? **No**

### 2. Add Environment Variables
```bash
vercel env add VITE_SUPABASE_URL
# Paste: https://gglzmggwifbkxtxjclcw.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Paste your anon key from .env file
```

### 3. Add Custom Domain
```bash
vercel domains add simulation.changesolutionshub.com
```

Vercel will provide a CNAME target. Add this DNS record:
```
Type: CNAME
Name: simulation
Value: cname.vercel-dns.com
```

### 4. Deploy to Production
```bash
vercel --prod
```

---

## Option 2: Deploy with Netlify

### 1. Deploy via Netlify CLI
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login and deploy
netlify login
netlify init
```

### 2. Configure via Netlify Dashboard
1. Go to [app.netlify.com](https://app.netlify.com)
2. Select your new site
3. Go to **Site settings** > **Environment variables**
4. Add:
   - `VITE_SUPABASE_URL`: `https://gglzmggwifbkxtxjclcw.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: (from .env)

### 3. Add Custom Domain
1. Go to **Domain settings** > **Add custom domain**
2. Enter: `simulation.changesolutionshub.com`
3. Add DNS record provided by Netlify

---

## Option 3: Deploy via GitHub/GitLab (No CLI)

### For Vercel:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Add environment variables
4. Deploy
5. Add custom domain in settings

### For Netlify:
1. Go to [app.netlify.com/start](https://app.netlify.com/start)
2. Connect your Git repository
3. Add environment variables
4. Deploy
5. Add custom domain in settings

---

## DNS Configuration

Add this CNAME record to changesolutionshub.com DNS:

| Type  | Name       | Value                    | TTL  |
|-------|------------|--------------------------|------|
| CNAME | simulation | (provided by your host)  | 3600 |

**Common CNAME targets:**
- Vercel: `cname.vercel-dns.com`
- Netlify: `[your-site].netlify.app`

---

## Supabase Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/gglzmggwifbkxtxjclcw/auth/url-configuration)

2. Add to **Redirect URLs**:
```
https://simulation.changesolutionshub.com/**
```

3. Save changes

---

## Test Deployment

Once DNS propagates (5-60 minutes):

1. Visit: `https://simulation.changesolutionshub.com`
2. Test login
3. Test simulation flow
4. Verify data persistence

---

## Troubleshooting

**DNS not resolving?**
```bash
nslookup simulation.changesolutionshub.com
```

**Build failing?**
- Check environment variables are set
- Review build logs in hosting platform

**Authentication issues?**
- Verify Supabase redirect URLs
- Check browser console for errors

---

For detailed instructions, see **SUBDOMAIN_DEPLOYMENT_GUIDE.md**
