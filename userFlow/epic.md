 # Description

This Epic encompasses the implementation of a robust, high-security authentication system that supports both the Rider (B2C) and Driver (B2B) applications. Unlike standard web auth, this must prioritize mobile-first security and phone-number-based identity.

Key Features to Implement

Phone-First Authentication: SMS-based OTP verification (using Twilio/Firebase) for passwordless login.

Social Integration: One-click registration/login via Apple ID and Google for Rider onboarding speed.

Role-Based Provisioning: Logic to handle accounts that act as both Riders and Drivers (Switching context).

KYC (Know Your Customer): Initial hooks for driver document upload and background check status during signup.

Success Metrics

Onboarding Speed: New riders should be able to create an account in less than 60 seconds.

Security: 0% unauthorized access via session hijacking.

Cross-Platform: Support for iOS, Android, and Web portals.

Out of Scope for this Epic

Payment method linking (Reserved for Payments Epic).

Real-time location tracking (Reserved for Dispatch Epic).

Acceptance Criteria

Users can register/login with a verified phone number.

System prevents multiple accounts with the same phone number.

JWT or OAuth tokens are securely stored on device.

Account lockout mechanism after 5 failed OTP attempts.


# summary
Dual-Platform Identity & Security Framework (Rider & Driver)


# Storeis

# Summary 
Feature: Secure User Login Flow
# Desription
Provide a entry point for returning users (Riders & Drivers). The system must verify the user's identity against the database and issue an active session token.



Acceptance Criteria:

 User can enter Email or Phone Number.
 User receives a clear error message for invalid credentials.
 Clicking "Forgot Password" redirects to the recovery flow.
 Login state persists across app restarts (Persistent Session).
 Successfully logged-in users are redirected to the Map/Home Screen.


 # 🛠️ The Technical "Sub-task" Breakdown
Underneath each Story (like Login), you should create Sub-tasks for your developers. This is how you handle the actual work:

[UI/UX]: Build the Login screen using Tailwind/CSS (referencing your 

LoginForm.tsx
).
[Frontend]: Implement form validation (Check for empty fields, valid email).
[Backend]: Create the POST /auth/login endpoint.
[Security]: Implement Hashing (Bcrypt/Argon2) for password verification.
[QA]: Test login with incorrect credentials and expired tokens.