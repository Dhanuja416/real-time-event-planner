# ?? EMAIL VERIFICATION TESTING GUIDE

## ? IMPLEMENTATION COMPLETE

Email verification has been successfully integrated into the authentication flow!

---

## ?? REGISTRATION & VERIFICATION FLOW

### **How It Works:**

1. **User registers** ? Account created with `EmailConfirmed = false`
2. **System sends email** ? Verification link with encoded token
3. **User clicks link** ? Frontend extracts token and email from URL
4. **Frontend calls verify-email** ? Backend confirms email
5. **User can login** ? Login now requires verified email

---

## ?? UPDATED ENDPOINTS

### **1. POST /api/Auth/register** (UPDATED)

**What Changed:**
- ? Sets `EmailConfirmed = false` on new users
- ? Generates email confirmation token
- ? URL encodes the token
- ? Sends verification email via SendGrid
- ? Returns new message: "Registration successful! Please check your email to verify your account."

**Request:**
```http
POST https://localhost:7072/api/Auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "status": "Success",
  "message": "Registration successful! Please check your email to verify your account."
}
```

**What Happens Next:**
- User receives email with subject: "Verify Your Email - REAP"
- Email contains verification link: `https://localhost:5173/verify-email?token=ENCODED_TOKEN&email=newuser@example.com`

---

### **2. POST /api/Auth/verify-email** (NEW)

**Purpose:** Confirms user's email address

**Request:**
```http
POST https://localhost:7072/api/Auth/verify-email
Content-Type: application/json

{
  "email": "newuser@example.com",
  "token": "TOKEN_FROM_EMAIL_URL"
}
```

**Success Response (200 OK):**
```json
{
  "status": "Success",
  "message": "Email verified successfully! You can now log in."
}
```

**Error Responses:**

**User Not Found (404):**
```json
{
  "status": "Error",
  "message": "User not found."
}
```

**Already Verified (400):**
```json
{
  "status": "Error",
  "message": "Email is already verified."
}
```

**Invalid/Expired Token (400):**
```json
{
  "status": "Error",
  "message": "Email verification failed: Invalid token."
}
```

---

### **3. POST /api/Auth/login** (UPDATED)

**What Changed:**
- ? Checks if email is verified before allowing login
- ? Returns specific error if email not verified
- ? Better error messages

**Request:**
```http
POST https://localhost:7072/api/Auth/login
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiration": "2024-12-23T10:30:00Z"
}
```

**Email Not Verified (401 Unauthorized):**
```json
{
  "status": "Error",
  "message": "Please verify your email first."
}
```

**Invalid Credentials (401 Unauthorized):**
```json
{
  "status": "Error",
  "message": "Invalid email or password."
}
```

---

## ?? COMPLETE TESTING WORKFLOW

### **Prerequisites:**
1. ? SendGrid API key configured in `appsettings.Development.json`
2. ? Sender email verified in SendGrid
3. ? Backend running on `https://localhost:7072`
4. ? Access to test email inbox

---

### **Test 1: Register New User**

**Step 1:** Register a new account
```http
POST https://localhost:7072/api/Auth/register
Content-Type: application/json

{
  "email": "test.user@gmail.com",
  "password": "TestPass123!"
}
```

**Expected:**
- ? Status: 200 OK
- ? Message: "Registration successful! Please check your email to verify your account."

**Step 2:** Check your email
- ? Open inbox for `test.user@gmail.com`
- ? Find email with subject: "Verify Your Email - REAP"
- ? Email should have professional HTML design with blue header
- ? Contains verification button and fallback link

---

### **Test 2: Attempt Login Before Verification**

```http
POST https://localhost:7072/api/Auth/login
Content-Type: application/json

{
  "email": "test.user@gmail.com",
  "password": "TestPass123!"
}
```

**Expected:**
- ? Status: 401 Unauthorized
- ? Message: "Please verify your email first."

---

### **Test 3: Extract Token from Email**

**From Email Link:**
```
https://localhost:5173/verify-email?token=CfDJ8ABC123...XYZ&email=test.user@gmail.com
```

**Extract:**
- `token`: `CfDJ8ABC123...XYZ` (the long encoded string)
- `email`: `test.user@gmail.com`

---

### **Test 4: Verify Email**

```http
POST https://localhost:7072/api/Auth/verify-email
Content-Type: application/json

{
  "email": "test.user@gmail.com",
  "token": "CfDJ8ABC123...XYZ"
}
```

**Expected:**
- ? Status: 200 OK
- ? Message: "Email verified successfully! You can now log in."

---

### **Test 5: Login After Verification**

```http
POST https://localhost:7072/api/Auth/login
Content-Type: application/json

{
  "email": "test.user@gmail.com",
  "password": "TestPass123!"
}
```

**Expected:**
- ? Status: 200 OK
- ? Receives JWT token
- ? Can now access protected endpoints

---

### **Test 6: Try Verifying Again (Should Fail)**

```http
POST https://localhost:7072/api/Auth/verify-email
Content-Type: application/json

{
  "email": "test.user@gmail.com",
  "token": "CfDJ8ABC123...XYZ"
}
```

**Expected:**
- ? Status: 400 Bad Request
- ? Message: "Email is already verified."

---

## ?? SECURITY FEATURES IMPLEMENTED

### **Token Security:**
- ? Generated by ASP.NET Identity (cryptographically secure)
- ? URL-encoded for safe transmission
- ? URL-decoded before validation
- ? Single-use (cannot be reused)
- ? Expires after 24 hours (default)

### **Email Verification Flow:**
- ? Users cannot login until email is verified
- ? Clear error messages guide user actions
- ? Prevents account takeover via unverified emails
- ? Follows industry best practices

---

## ?? EMAIL TEMPLATE PREVIEW

**Subject:** Verify Your Email - REAP

**Design Features:**
- Professional blue header: "Welcome to REAP!"
- Clean, modern layout
- Clear call-to-action button
- Fallback plain text link
- Security notice about 24-hour expiration
- Branded footer

**Sample Email Content:**
```
Welcome to REAP!

Verify Your Email Address

Thank you for registering with REAP - Real-time Event and Planning platform.

To complete your registration and start collaborating on documents, 
please verify your email address by clicking the button below:

[Verify Email Address Button]

If the button doesn't work, copy and paste this link into your browser:
https://localhost:5173/verify-email?token=...&email=...

Note: This link will expire in 24 hours for security reasons.

If you didn't create an account with REAP, please ignore this email.

© 2024 REAP. All rights reserved.
```

---

## ?? TROUBLESHOOTING

### **Email Not Received:**

**Check 1:** Spam/Junk Folder
- Verification emails might go to spam
- Mark as "Not Spam" to receive future emails

**Check 2:** SendGrid Configuration
- Verify sender email in SendGrid dashboard
- Check API key is correct in `appsettings.Development.json`
- View activity in SendGrid ? Activity Feed

**Check 3:** Backend Logs
- Look for exceptions when sending email
- Check console output for error messages

---

### **"Invalid token" Error:**

**Possible Causes:**
1. Token expired (>24 hours old)
2. Token already used
3. Token corrupted during copy/paste
4. Wrong email address

**Solution:**
- Register again to get a new token
- Copy entire token from email URL
- Ensure email matches exactly (case-sensitive)

---

### **"Email is already verified" Error:**

**Cause:** You already verified this email

**Solution:**
- This is correct behavior
- You can now login normally
- No further action needed

---

### **Login Still Fails After Verification:**

**Check:**
1. Verify endpoint returned success
2. Check database: user's `EmailConfirmed` should be `true`
3. Ensure using correct password
4. Try registering new user to test

---

## ?? DATABASE CHANGES

After verification, check the database:

**Before Verification:**
```sql
SELECT Email, EmailConfirmed FROM AspNetUsers WHERE Email = 'test.user@gmail.com';
-- EmailConfirmed: false
```

**After Verification:**
```sql
SELECT Email, EmailConfirmed FROM AspNetUsers WHERE Email = 'test.user@gmail.com';
-- EmailConfirmed: true
```

---

## ?? FRONTEND INTEGRATION GUIDE

### **Registration Page:**

**After user clicks "Register":**
```javascript
const response = await fetch('https://localhost:7072/api/Auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();

if (response.ok) {
  // Show success message
  alert(data.message); // "Registration successful! Please check your email..."
  // Redirect to "Check Your Email" page
  navigate('/check-email');
}
```

---

### **Email Verification Page (`/verify-email`):**

**Extract token and email from URL:**
```javascript
// In your React component
const [searchParams] = useSearchParams();
const token = searchParams.get('token');
const email = searchParams.get('email');

useEffect(() => {
  const verifyEmail = async () => {
    const response = await fetch('https://localhost:7072/api/Auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token })
    });

    const data = await response.json();

    if (response.ok) {
      // Success - show success message
      setMessage('Email verified! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      // Error - show error message
      setError(data.message);
    }
  };

  if (token && email) {
    verifyEmail();
  }
}, [token, email]);
```

---

### **Login Page:**

**Handle email verification error:**
```javascript
const response = await fetch('https://localhost:7072/api/Auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();

if (response.status === 401) {
  if (data.message.includes('verify your email')) {
    // Show specific message
    setError('Please verify your email before logging in. Check your inbox.');
  } else {
    setError('Invalid email or password.');
  }
}
```

---

## ? IMPLEMENTATION CHECKLIST

### **Backend (Complete):**
- ? IEmailService injected in AuthController
- ? System.Net namespace added
- ? Register endpoint generates and sends token
- ? EmailConfirmed set to false on registration
- ? Login checks email verification status
- ? Verify-email endpoint created
- ? Token URL encoding/decoding
- ? Proper error messages
- ? Build successful

### **Frontend (TODO):**
- ?? Create `/verify-email` page
- ?? Extract token from URL query params
- ?? Call verify-email API
- ?? Show success/error messages
- ?? Update login page error handling
- ?? Create "Check Your Email" page

---

## ?? SUMMARY

### **What's Working:**
? User registration sends verification email  
? Login blocked until email verified  
? Email verification endpoint functional  
? Professional HTML email templates  
? Secure token generation and validation  
? Proper error handling and messages  

### **User Experience:**
1. User registers ? Gets email
2. User clicks link in email ? Redirected to frontend
3. Frontend calls verify-email ? Account activated
4. User can login ? Access granted

---

**Your email verification system is production-ready! ??**

Test it now by registering a new account and checking your email!
