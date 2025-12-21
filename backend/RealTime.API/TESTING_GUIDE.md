# ?? BACKEND IMPLEMENTATION COMPLETE - TESTING GUIDE

## ? WHAT WAS IMPLEMENTED

### 1. **New Models Created**
- ? `Document.cs` - Main document entity with owner relationship
- ? `DocumentPermission.cs` - Permission system (Viewer/Editor/Owner)
- ? `PermissionLevel` enum (Viewer=1, Editor=2, Owner=3)

### 2. **New DTOs Created**
- ? `CreateDocumentDto.cs` - For creating new documents
- ? `UpdateDocumentDto.cs` - For updating documents
- ? `ShareDocumentDto.cs` - For sharing documents with users

### 3. **Database Updates**
- ? Updated `AppDbContext.cs` with Documents and DocumentPermissions DbSets
- ? Configured entity relationships (one-to-many, cascade deletes)
- ? Added unique composite index on (DocumentId, UserId)
- ? Migration created: `AddDocumentsAndPermissions`
- ? Migration applied successfully to PostgreSQL database

### 4. **New Controller Created**
- ? `DocumentsController.cs` with full CRUD operations
- ? GET /api/Documents - Get all user's documents
- ? GET /api/Documents/{id} - Get specific document
- ? POST /api/Documents - Create new document
- ? PUT /api/Documents/{id} - Update document
- ? DELETE /api/Documents/{id} - Delete document (owner only)
- ? POST /api/Documents/{id}/share - Share document with users

---

## ?? TESTING INSTRUCTIONS

### **Prerequisites**
- Backend API running on: `https://localhost:7294` (or your configured port)
- Use Postman, Thunder Client, or any REST client
- You'll need 2 user accounts for testing sharing features

---

### **Step 1: Create User Accounts**

#### Register User 1 (Owner)
```http
POST https://localhost:7294/api/Auth/register
Content-Type: application/json

{
  "email": "owner@test.com",
  "password": "Test@123456"
}
```

**Expected Response:**
```json
{
  "status": "Success",
  "message": "User created successfully!"
}
```

#### Register User 2 (Collaborator)
```http
POST https://localhost:7294/api/Auth/register
Content-Type: application/json

{
  "email": "collaborator@test.com",
  "password": "Test@123456"
}
```

---

### **Step 2: Login as Owner**

```http
POST https://localhost:7294/api/Auth/login
Content-Type: application/json

{
  "email": "owner@test.com",
  "password": "Test@123456"
}
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiration": "2024-12-23T08:32:20Z"
}
```

**?? SAVE THE TOKEN - You'll use it in all subsequent requests!**

---

### **Step 3: Create a Document**

```http
POST https://localhost:7294/api/Documents
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "title": "My First Document",
  "content": "This is the initial content of my document."
}
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "title": "My First Document",
  "content": "This is the initial content of my document.",
  "ownerId": "user-guid-here",
  "createdAt": "2024-12-16T08:30:00Z",
  "updatedAt": "2024-12-16T08:30:00Z",
  "owner": {
    "id": "user-guid-here",
    "userName": "owner@test.com",
    "email": "owner@test.com"
  },
  "permissions": []
}
```

**?? SAVE THE DOCUMENT ID (e.g., 1) - You'll use it in subsequent requests!**

---

### **Step 4: Get All Documents**

```http
GET https://localhost:7294/api/Documents
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "My First Document",
    "content": "This is the initial content of my document.",
    "ownerId": "user-guid-here",
    "createdAt": "2024-12-16T08:30:00Z",
    "updatedAt": "2024-12-16T08:30:00Z",
    "owner": {...},
    "permissions": []
  }
]
```

---

### **Step 5: Get Specific Document**

```http
GET https://localhost:7294/api/Documents/1
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response (200 OK):**
Same as create response with full document details.

---

### **Step 6: Update Document**

```http
PUT https://localhost:7294/api/Documents/1
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "id": 1,
  "title": "My Updated Document",
  "content": "This content has been updated with new information."
}
```

**Expected Response (204 No Content)**
- Status: 204 (success, no body returned)

---

### **Step 7: Share Document with Collaborator**

```http
POST https://localhost:7294/api/Documents/1/share
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "documentId": 1,
  "userEmail": "collaborator@test.com",
  "permissionLevel": 2
}
```

**Permission Levels:**
- `1` = Viewer (read-only)
- `2` = Editor (can read and edit)
- `3` = Owner (full control)

**Expected Response (200 OK):**
```json
{
  "message": "Document shared with collaborator@test.com as Editor."
}
```

---

### **Step 8: Login as Collaborator**

```http
POST https://localhost:7294/api/Auth/login
Content-Type: application/json

{
  "email": "collaborator@test.com",
  "password": "Test@123456"
}
```

**?? SAVE THE NEW TOKEN - Use this for collaborator requests!**

---

### **Step 9: Verify Collaborator Can See Shared Document**

```http
GET https://localhost:7294/api/Documents
Authorization: Bearer COLLABORATOR_TOKEN_HERE
```

**Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "My Updated Document",
    "content": "This content has been updated with new information.",
    "ownerId": "owner-guid-here",
    "permissions": [
      {
        "id": 1,
        "documentId": 1,
        "userId": "collaborator-guid-here",
        "level": 2,
        "grantedAt": "2024-12-16T08:35:00Z"
      }
    ]
  }
]
```

---

### **Step 10: Test Collaborator Can Edit (Editor Permission)**

```http
PUT https://localhost:7294/api/Documents/1
Authorization: Bearer COLLABORATOR_TOKEN_HERE
Content-Type: application/json

{
  "id": 1,
  "title": "Edited by Collaborator",
  "content": "The collaborator has successfully edited this document."
}
```

**Expected Response (204 No Content)**
- ? Success - Editor can update documents

---

### **Step 11: Test Collaborator CANNOT Delete (Owner Only)**

```http
DELETE https://localhost:7294/api/Documents/1
Authorization: Bearer COLLABORATOR_TOKEN_HERE
```

**Expected Response (403 Forbidden)**
```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.4",
  "title": "Forbidden",
  "status": 403
}
```

- ? Correct - Only owner can delete documents

---

### **Step 12: Switch Back to Owner and Test Delete**

```http
DELETE https://localhost:7294/api/Documents/1
Authorization: Bearer OWNER_TOKEN_HERE
```

**Expected Response (204 No Content)**
- ? Success - Owner can delete documents

---

## ?? EXPECTED BEHAVIOR SUMMARY

| Action | Owner | Editor | Viewer | No Permission |
|--------|-------|--------|--------|---------------|
| View Document | ? | ? | ? | ? |
| Create Document | ? | ? | ? | ? (creates own) |
| Update Document | ? | ? | ? | ? |
| Delete Document | ? | ? | ? | ? |
| Share Document | ? | ? | ? | ? |

---

## ?? TESTING VIEWER PERMISSIONS

To test viewer (read-only) permissions:

1. Login as owner
2. Create a new document (ID: 2)
3. Share with collaborator as Viewer (permissionLevel: 1)
4. Login as collaborator
5. Try to update document 2 ? **Should get 403 Forbidden**

```http
POST https://localhost:7294/api/Documents/2/share
Authorization: Bearer OWNER_TOKEN
Content-Type: application/json

{
  "documentId": 2,
  "userEmail": "collaborator@test.com",
  "permissionLevel": 1
}
```

Then try to update as collaborator:
```http
PUT https://localhost:7294/api/Documents/2
Authorization: Bearer COLLABORATOR_TOKEN
Content-Type: application/json

{
  "id": 2,
  "title": "Trying to edit as viewer",
  "content": "This should fail"
}
```

**Expected:** 403 Forbidden ?

---

## ?? SIGNALR REAL-TIME TESTING

When you create, update, delete, or share a document, the backend broadcasts to all connected SignalR clients:

```javascript
// Frontend should listen for:
connection.on("DocumentReceived", (document, action) => {
  console.log(`Document ${action}:`, document);
  // action can be: "created", "updated", "deleted", "shared"
});
```

---

## ? SUCCESS CRITERIA

### All Tests Should Pass:
- ? User registration and login works
- ? Authenticated users can create documents
- ? Users can view their own documents
- ? Users can update their own documents
- ? Users can delete their own documents
- ? Owners can share documents with others
- ? Shared users can see shared documents
- ? Editors can update shared documents
- ? Viewers can only read shared documents
- ? Non-owners cannot delete documents
- ? Non-owners cannot share documents
- ? Users cannot access documents they don't own or have permission for

---

## ?? TROUBLESHOOTING

### **401 Unauthorized**
- Check if JWT token is included in Authorization header
- Format: `Authorization: Bearer YOUR_TOKEN`
- Token might be expired (7 days from login)

### **403 Forbidden**
- User doesn't have required permission level
- Only owners can delete/share
- Viewers cannot edit

### **404 Not Found**
- Document doesn't exist
- User with that email doesn't exist (when sharing)

### **400 Bad Request**
- Missing required fields
- ID in URL doesn't match ID in body
- Invalid email format

---

## ?? IMPLEMENTATION COMPLETE!

Your backend now supports:
- ? User-specific document ownership
- ? Permission-based sharing (Owner/Editor/Viewer)
- ? Real-time updates via SignalR
- ? Secure authorization checks
- ? Full CRUD operations with proper validation

**Next Steps:**
1. Test all endpoints using the guide above
2. Integrate with your React frontend
3. Test real-time collaboration with multiple browser windows
4. Add rich text editor integration (Quill.js/TipTap + Y.js)

---

**Database Schema Created:**
- ? Documents table (with OwnerId foreign key)
- ? DocumentPermissions table (with unique composite index)
- ? All relationships configured with cascade deletes
- ? Indexes created for performance

**You're ready for Google Docs-style collaboration! ??**
