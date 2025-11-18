# VERITAS Demo - Website Deployment Checklist

## Pre-Upload Testing

### ✓ Local Testing (Do This First!)
1. [ ] Extract the VERITAS_Web_Package folder to your desktop
2. [ ] Open VERITAS_Interactive_Demo_Web.html in Chrome/Firefox
3. [ ] Test all 4 topics (Election Fraud, Immigration, National Debt, Gender Identity)
4. [ ] Click on at least one article from each topic
5. [ ] Verify the original article displays in Step 2
6. [ ] Verify the VERITAS assessment displays in Step 4
7. [ ] Test the "Back to Articles" navigation
8. [ ] Confirm logo displays correctly

**If any issues:** Fix them before uploading to website!

---

## Website Upload Steps

### Step 1: Prepare Files
1. [ ] Keep the VERITAS_Web_Package folder structure intact
2. [ ] Do NOT rename any files or folders
3. [ ] Do NOT move files out of their folders

### Step 2: Upload to Web Server
Using your hosting control panel or FTP client:

1. [ ] Connect to your web server (veritastruth.net)
2. [ ] Navigate to your public_html or www root directory
3. [ ] Upload the **entire VERITAS_Web_Package folder** (not just the contents)
4. [ ] Verify the folder structure on server matches local:
   ```
   /public_html/VERITAS_Web_Package/
   ├── VERITAS_Interactive_Demo_Web.html
   ├── veritas-logo.png
   ├── README.md
   └── articles/
       ├── election-fraud/ (3 files)
       ├── immigration/ (3 files)
       ├── national-debt/ (3 files)
       └── gender-identity/ (3 files)
   ```

### Step 3: Update Your Website Links
1. [ ] Edit your homepage (index.html)
2. [ ] Add or update link to demo:
   ```html
   <a href="/VERITAS_Web_Package/VERITAS_Interactive_Demo_Web.html">
     View Interactive Demo
   </a>
   ```
3. [ ] Save changes
4. [ ] Upload updated index.html

### Step 4: Test Live Demo
1. [ ] Visit https://veritastruth.net/VERITAS_Web_Package/VERITAS_Interactive_Demo_Web.html
2. [ ] Test all 4 topics
3. [ ] Click through several articles
4. [ ] Verify original articles load correctly
5. [ ] Test on mobile device
6. [ ] Test in different browsers (Chrome, Firefox, Safari)

---

## Common Issues & Solutions

### Issue: Demo page loads but articles don't display
**Solution:** Check that the articles/ folder uploaded correctly and is in the same directory as the HTML file

### Issue: Logo doesn't display
**Solution:** Verify veritas-logo.png is in the same directory as the HTML file

### Issue: "File not found" errors
**Solution:** 
- Check file permissions on server (should be 644 for files, 755 for folders)
- Verify folder structure matches exactly as shown above
- Check for case sensitivity issues (use exact filenames)

### Issue: Demo works locally but not on website
**Solution:**
- Clear your browser cache
- Check browser console for errors (F12 > Console tab)
- Verify the server path in your browser matches your upload location

---

## Post-Deployment Testing

### Desktop Browsers
1. [ ] Chrome - Test full demo
2. [ ] Firefox - Test full demo  
3. [ ] Safari - Test full demo
4. [ ] Edge - Test full demo

### Mobile Browsers
1. [ ] iPhone Safari - Test basic navigation
2. [ ] Android Chrome - Test basic navigation

### Share with Test Users
1. [ ] Send link to 2-3 trusted people
2. [ ] Ask them to test on their devices
3. [ ] Collect feedback on any issues

---

## Success Criteria

Your deployment is successful when:
- ✅ All 4 topics are clickable
- ✅ All 12 articles display correctly
- ✅ Original article view (Step 2) works for each article
- ✅ VERITAS assessment (Step 4) displays for each article
- ✅ Navigation between views works smoothly
- ✅ Logo displays in top-right corner
- ✅ Works on desktop and mobile browsers
- ✅ No broken links or "file not found" errors

---

## Ready for Stakeholders!

Once all checks pass:
- ✅ Update your email signature with demo link
- ✅ Add demo link to LinkedIn profile
- ✅ Share with Anthropic contact
- ✅ Include in Knight Foundation application
- ✅ Send to potential angel investors

**Your demo URL:**
https://veritastruth.net/VERITAS_Web_Package/VERITAS_Interactive_Demo_Web.html

---

*Questions? Email rauel@veritastruth.net* 🖖
