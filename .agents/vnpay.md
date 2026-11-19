---
description: "VNPay payment integration guidelines for the e-commerce system"
globs: "backend/**/*.ts, frontend/**/*.{ts,tsx}"
---

# VNPay Payment Integration Guidelines

## Overview

The project uses VNPay as the payment gateway. Development uses VNPay Sandbox; production uses VNPay live credentials.

## Payment Flow

```
1. User clicks "Pay with VNPay" on checkout page
2. Frontend → Backend: POST /api/orders (create order with status PENDING)
3. Backend creates VNPay payment URL with order details
4. Backend → Frontend: Returns VNPay redirect URL
5. Frontend redirects user to VNPay payment page
6. User completes payment on VNPay
7. VNPay → Backend: IPN callback (server-to-server, async)
8. VNPay → Frontend: Return URL redirect (user sees result)
9. Backend verifies checksum, updates order status
10. Frontend shows payment result page
```

## Backend Implementation (NestJS)

### Configuration

```typescript
// Use environment variables — never hardcode
VNP_TMN_CODE=your_terminal_code
VNP_HASH_SECRET=your_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html  // sandbox
VNP_RETURN_URL=https://yourdomain.com/payment/result
VNP_IPN_URL=https://yourdomain.com/api/payment/vnpay-ipn
```

### Key Rules

- **Checksum Verification:** ALWAYS verify `vnp_SecureHash` on both IPN and Return URL callbacks using HMAC-SHA512.
- **Idempotency:** Check if order payment was already processed before updating status (prevent duplicate processing).
- **Order Amount:** Send amount in VND × 100 (VNPay requirement). E.g., 100,000 VND → send 10000000.
- **Transaction Reference:** Use unique `vnp_TxnRef` per transaction (order ID or UUID).
- **IPN Response:** Return `{"RspCode": "00", "Message": "Confirm Success"}` for successful processing.

### IPN Callback Handler

```typescript
// CRITICAL: IPN is server-to-server — no auth required but MUST verify checksum
@Post('vnpay-ipn')
async handleVnpayIPN(@Query() query: Record<string, string>) {
  // 1. Verify checksum
  // 2. Find order by vnp_TxnRef
  // 3. Check if amount matches
  // 4. Check if order is still PENDING (idempotency)
  // 5. Update order status based on vnp_ResponseCode
  // 6. Return response code
}
```

## Frontend Implementation

- **Never** handle payment logic on frontend — only redirect and display results.
- Show loading state while redirecting to VNPay.
- Handle return URL: parse query params, display success/failure message.
- Provide fallback: COD (Cash on Delivery) as alternative payment method.

## Testing

- Use VNPay Sandbox credentials for all development and testing.
- Test card numbers provided by VNPay sandbox documentation.
- Test scenarios: successful payment, failed payment, timeout, duplicate IPN.
- Mock VNPay responses in unit tests.

## Security

- Store `VNP_HASH_SECRET` in environment variables only.
- Validate all VNPay callback parameters.
- Log all payment transactions for audit trail.
- Use HTTPS for all VNPay communication.
- Implement timeout handling for pending payments.
