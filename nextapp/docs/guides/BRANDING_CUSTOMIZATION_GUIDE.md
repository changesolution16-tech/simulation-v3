# Branding Customization Guide

## Overview

The application now supports full branding customization, allowing you to personalize the login page and overall appearance with your company's logo, colors, and information.

## What Was Changed

### 1. Login Page Updates ✅

**Removed:**
- Pre-filled test account credentials (admin@example.com, teacher@example.edu, student@university.edu)
- Test account information box from login page
- Hardcoded placeholder text

**Added:**
- Dynamic logo display (defaults to icon if no logo uploaded)
- Customizable primary and secondary colors
- Editable login page title and subtitle
- All elements now load from database settings

### 2. Footer Updates ✅

**Changed:**
- Footer copyright now reads: "2025 Softskills Simulations - Change Solutions Limited"
- Footer text is dynamic and can be customized from admin panel
- Updates across all pages automatically

### 3. New Admin Features ✅

**Branding Settings Panel:**
- Located in Admin Dashboard → System → Branding
- Upload company logo (PNG, JPG, or SVG, max 2MB)
- Choose custom primary color (buttons, links, main elements)
- Choose custom secondary color (hover states)
- Customize login page title
- Customize login page subtitle
- Set company name for footer

## How to Customize Your Branding

### Step 1: Access Branding Settings

1. Log in as an admin user
2. Navigate to **Admin Dashboard**
3. Click **System** section
4. Select **Branding** tab

### Step 2: Upload Your Logo

1. Click the file input under "Company Logo"
2. Select your logo file (PNG, JPG, or SVG)
3. Wait for upload to complete
4. Preview will appear automatically

**Logo Requirements:**
- File format: PNG, JPG, or SVG
- Maximum size: 2MB
- Recommended dimensions: 200x80px (will scale automatically)
- Transparent background recommended for best results

### Step 3: Choose Your Brand Colors

1. **Primary Color:**
   - Used for buttons, links, and main UI elements
   - Click the color picker or enter a hex code (e.g., #2563eb)

2. **Secondary Color:**
   - Used for hover states
   - Should be slightly darker/lighter than primary color
   - Click the color picker or enter a hex code (e.g., #1e40af)

3. **Preview:**
   - Use the "Hover Me" button to see how colors look
   - Colors apply in real-time to the preview

### Step 4: Customize Text Content

1. **Login Page Title:**
   - Main heading on login page
   - Default: "Soft Skills Simulation"

2. **Login Page Subtitle:**
   - Descriptive text below title
   - Default: "Sign in to access your personalized soft skills training"

3. **Company Name (Footer):**
   - Appears in footer across all pages
   - Default: "2025 Softskills Simulations - Change Solutions Limited"
   - Include year and full company information

### Step 5: Save Your Changes

1. Click **"Save Changes"** button at the bottom
2. Wait for confirmation message
3. Refresh login page to see changes
4. All users will see new branding immediately

## Technical Details

### Database Schema

A new table `branding_settings` stores all customization:
- `logo_url` - URL to uploaded logo
- `primary_color` - Primary brand color (hex)
- `secondary_color` - Secondary brand color (hex)
- `company_name` - Company name for footer
- `login_title` - Login page title
- `login_subtitle` - Login page subtitle

### Security

- Only admin users can modify branding settings
- Logo uploads are stored in Supabase Storage
- All users can view branding (required for login page)
- Changes are logged with admin user ID and timestamp

### Files Created/Modified

**New Files:**
- `src/lib/branding.ts` - Branding utility functions
- `src/components/admin/BrandingSettings.tsx` - Admin panel component
- `supabase/migrations/[timestamp]_add_branding_settings.sql` - Database migration

**Modified Files:**
- `src/components/auth/Login.tsx` - Dynamic branding support
- `src/components/Layout.tsx` - Dynamic footer
- `src/components/admin/AdminDashboard.tsx` - Added branding tab

## Default Values

If no custom branding is set, the application uses these defaults:

- **Logo:** Blue icon with brain circuit symbol
- **Primary Color:** #2563eb (blue)
- **Secondary Color:** #1e40af (darker blue)
- **Company Name:** "2025 Softskills Simulations - Change Solutions Limited"
- **Login Title:** "Soft Skills Simulation"
- **Login Subtitle:** "Sign in to access your personalized soft skills training"

## Best Practices

### Logo Design

1. **Simple is Better:** Use a clean, recognizable logo
2. **Readable:** Ensure logo is clear at small sizes
3. **Scalable:** Vector formats (SVG) scale best
4. **Transparent Background:** Looks professional on any background

### Color Selection

1. **Contrast:** Ensure text is readable on colored backgrounds
2. **Consistency:** Use colors from your existing brand guidelines
3. **Accessibility:** Choose colors that work for colorblind users
4. **Testing:** Preview colors on different screens/devices

### Text Content

1. **Concise:** Keep titles short and clear
2. **Professional:** Use proper grammar and punctuation
3. **Brand Voice:** Match your company's communication style
4. **Legal:** Include year and full company name in footer

## Troubleshooting

### Logo Not Appearing

- Check file size (must be < 2MB)
- Verify file format (PNG, JPG, or SVG only)
- Try a different browser
- Clear browser cache
- Check browser console for errors

### Colors Not Updating

- Ensure hex codes start with # (e.g., #2563eb)
- Click "Save Changes" after modifying
- Refresh the page
- Clear browser cache if needed

### Changes Not Visible to Other Users

- Verify you clicked "Save Changes"
- Check for error messages
- Other users may need to refresh their browsers
- Logout and login again to see updates

### Permission Issues

- Only admin users can modify branding
- Verify your account has admin role
- Contact system administrator if needed

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify admin permissions
3. Review this guide thoroughly
4. Contact technical support with:
   - Screenshots of issue
   - Browser and version
   - Error messages from console
   - Steps to reproduce

---

**Last Updated:** 2025-10-31  
**Version:** 1.0  
**Build Status:** ✅ Passing
