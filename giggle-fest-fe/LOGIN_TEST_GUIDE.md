# Login Testing Guide

## Test Scenarios

### 1. **Invalid Email/Password (401 Error)**

**Test:** Enter wrong credentials

- Email: `wrong@email.com`
- Password: `wrongpassword`

**Expected Result:**

- ⚠️ Red error notification appears with shake animation
- Message: "Email atau password salah. Silakan coba lagi."

---

### 2. **Unverified Email (403 Error)**

**Test:** Use an unverified account

- Email: [unverified account]
- Password: [correct password]

**Expected Result:**

- ⚠️ Red error notification appears with shake animation
- Message: "Email Anda belum diverifikasi. Silakan cek email Anda."

---

### 3. **Server Connection Error**

**Test:** Stop the backend server and try to login

**Expected Result:**

- ⚠️ Red error notification appears with shake animation
- Message: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."

---

### 4. **Successful Login**

**Test:** Enter valid credentials

- Email: [valid verified email]
- Password: [correct password]

**Expected Result:**

- ✓ Green success notification appears
- Message: "Login Berhasil! Mengalihkan ke halaman utama..."
- After 1 second, redirects to homepage
- Token saved in localStorage

---

## Error Handling Features

✅ **Smart Error Messages** - Different messages for different error types
✅ **Shake Animation** - Error notification shakes to grab attention
✅ **Loading State** - Button shows "MASUK..." and is disabled during request
✅ **Success Feedback** - Green notification confirms successful login
✅ **Auto-redirect** - Navigates to homepage after successful login
✅ **Token Storage** - Saves authentication token for future requests

## Visual Indicators

- **Error:** Red background, warning icon (⚠️), shake animation
- **Success:** Green background, checkmark icon (✓), smooth transition
- **Loading:** Button disabled, text changes to "MASUK..."

## How to Run

1. Start backend: `cd giggle-fest-be-repository && npm start`
2. Start frontend: `cd giggle-fest-fe && npm run dev`
3. Navigate to: `http://localhost:5173/login`
4. Test different scenarios above
