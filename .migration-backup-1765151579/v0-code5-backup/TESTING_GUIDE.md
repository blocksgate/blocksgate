# Testing Guide

Complete testing checklist for your DeFi trading platform.

## 1. Authentication Flow Testing

### Test Case 1.1: Sign Up
1. Navigate to `/auth/login`
2. Click "Sign up" link
3. Fill in email and password
4. Submit the form
5. Expected: Confirmation email sent
6. Check your email for confirmation link
7. Click confirmation link
8. Expected: Redirected to success page

### Test Case 1.2: Email Confirmation
1. After sign up, check email
2. Click "Confirm your email" link
3. Expected: Redirected to sign-up-success page
4. Click "Go to Dashboard" button
5. Expected: Logged in and redirected to dashboard

### Test Case 1.3: Login
1. Navigate to `/auth/login`
2. Enter registered email and password
3. Click "Sign In"
4. Expected: Redirected to dashboard
5. Verify user profile is displayed

### Test Case 1.4: Protected Routes
1. Logout or open incognito window
2. Try to access `/dashboard` without logging in
3. Expected: Redirected to login page

### Test Case 1.5: Logout
1. On dashboard, look for logout button
2. Click logout
3. Expected: Redirected to home page
4. Try accessing `/dashboard` again
5. Expected: Redirected to login page

## 2. API Endpoint Testing

### Test Case 2.1: Get Profile
\`\`\`bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`
Expected: 200 with user profile data

### Test Case 2.2: Create Trade
\`\`\`bash
curl -X POST http://localhost:3000/api/trades \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token_in": "0xEeeeeEeeeEeEeeEeEeeEeeEEEeeeeEeeeeeeeEEeE",
    "token_out": "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "amount_in": "1000000000000000000",
    "amount_out": "2000000000",
    "price_at_time": 2000,
    "chain_id": 1,
    "trade_type": "swap"
  }'
\`\`\`

### Test Case 2.3: Get Trade History
\`\`\`bash
curl -X GET http://localhost:3000/api/trades \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`
Expected: 200 with array of trades

### Test Case 2.4: Get Portfolio
\`\`\`bash
curl -X GET http://localhost:3000/api/portfolio \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`
Expected: 200 with portfolio holdings

### Test Case 2.5: Get Portfolio Analytics
\`\`\`bash
curl -X GET http://localhost:3000/api/analytics/portfolio \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`
Expected: 200 with performance metrics

## 3. Database Verification

### Test Case 3.1: Verify Tables Exist
\`\`\`sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
\`\`\`
Expected output:
- audit_logs
- orders
- portfolios
- price_history
- profiles
- trades

### Test Case 3.2: Verify RLS is Enabled
\`\`\`sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
\`\`\`
Expected: All user-facing tables have `rowsecurity = true`

### Test Case 3.3: Test RLS Policies
1. Create two test users
2. User A creates a trade
3. Try accessing User A's trades as User B
4. Expected: Error or empty result (RLS blocking)

## 4. Real-Time Features Testing

### Test Case 4.1: Price Feed Updates
1. Open dashboard with portfolio holdings
2. Wait 10-15 seconds
3. Expected: Prices update without page refresh
4. Price changes should be reflected

### Test Case 4.2: Trade Execution
1. Go to swap page
2. Select tokens and amount
3. Click "Swap"
4. Expected: Transaction sent to wallet
5. After confirmation: Trade appears in history immediately
6. After ~5 seconds: Status changes to "completed"

## 5. Error Handling Testing

### Test Case 5.1: Invalid Trade
1. Try swapping 0 amount
2. Expected: User-friendly error message
3. "Invalid amount" or similar

### Test Case 5.2: Insufficient Balance
1. Try swapping more than wallet balance
2. Expected: Wallet connects and shows insufficient balance error

### Test Case 5.3: Network Error
1. Disconnect internet
2. Try any API call
3. Expected: Graceful error handling with retry option

### Test Case 5.4: Invalid Token
1. Try getting price for invalid token
2. Expected: 404 or "Token not found" error

## 6. Performance Testing

### Test Case 6.1: Dashboard Load Time
1. Clear cache
2. Open dashboard
3. Measure load time
4. Expected: Less than 3 seconds

### Test Case 6.2: Trade History Load
1. User with 100+ trades
2. Open history page
3. Load time should be acceptable
4. Pagination should work

## Test User Credentials

For testing, use these credentials:

\`\`\`
Email: test@example.com
Password: TestPassword123!
\`\`\`

Or create new test accounts during sign-up testing.

## Automated Testing

For CI/CD integration, create end-to-end tests:

\`\`\`bash
# Install Playwright
npm install -D @playwright/test

# Run tests
npx playwright test
\`\`\`

See `e2e/tests/` directory for test files.

## Success Criteria

All tests should pass before production deployment:
- Authentication flow: 5/5 passing
- API endpoints: 5/5 passing
- Database: 3/3 passing
- Real-time: 2/2 passing
- Error handling: 4/4 passing
- Performance: 2/2 passing

Total: 21/21 tests passing
