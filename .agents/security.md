---
description: "Guidelines for security"
globs: "**/*.{ts,tsx}"
---

// Pattern: **/*.{ts,tsx}
// Description: Security Best Practices for the E-commerce Electronics System

# Security Best Practices

You are implementing security features for an e-commerce electronics system that handles user data, payment information, and product recommendation data.

## General Security Principles

- Avoid using `eval()` as it can lead to security vulnerabilities
- Never use `innerHTML` as it can expose your application to XSS attacks
- Always validate and sanitize user input before using it
- Never log sensitive information like passwords
- Implement proper JWT token handling with appropriate expiration
- Use environment variables for secrets and sensitive configuration
- Implement role-based access control for different user types (Guest, User, Admin)
- Use proper CORS configuration for API endpoints
- Implement rate limiting for authentication endpoints
- Use HTTPS for all communication

## Authentication and Authorization

- Use JWT (Access Token + Refresh Token) for secure authentication via NestJS backend
- Store hashed passwords using bcrypt with appropriate salt rounds
- Implement proper session management with token rotation
- Use secure HTTP-only cookies for Refresh Token storage
- Validate user permissions before performing actions (Guards in NestJS)
- Implement CSRF protection for forms and API endpoints
- Use short-lived access tokens (15min) with refresh token rotation

## Data Protection

- Validate all input with Zod schemas (Frontend) and class-validator (Backend)
- Implement proper error handling that doesn't leak sensitive information
- Sanitize all user-generated content before displaying
- Use parameterized queries with TypeORM to prevent SQL injection
- Implement proper access controls at the database level
- Use encryption for sensitive data at rest
- Implement proper data backups and recovery procedures

## Payment Processing Security (VNPay)

- Use VNPay sandbox for development, VNPay production for deployment
- Follow VNPay integration guidelines for secure payment processing
- Validate VNPay IPN (Instant Payment Notification) callbacks with checksum verification
- Never store complete credit card details — VNPay handles card data
- Implement proper audit logging for payment transactions
- Use idempotency keys to prevent duplicate charges
- Implement proper error recovery for failed payments
- Always verify payment status via VNPay return URL and IPN before confirming orders