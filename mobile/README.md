# Bethany Homestay — Mobile Application (Android & iOS)

Dedicated native mobile experience for **Bethany Homestay (Kalimpong)** built using React Native and Expo.

---

## 1. Overview & Architecture

- **Authoritative Shared Backend**: Directly queries the existing Supabase database (`xiqtayqigrmxkvanxsmn.supabase.co`) with zero duplicate or diverging pricing logic.
- **Shared Schemas**:
  - `rooms`: Authoritative room inventory, seasonal pricing, view types, and features.
  - `bookings`: Direct reservation ledger with real-time status (`pending`, `confirmed`, `booked`).
  - `guests`: Guest identity and returning loyalty verification.
  - `invoices`: Itemized bill breakdown.
  - `coupons`: Dynamic promotional discounts and limit tracking.
  - `ota_blocked_dates`: Blocked calendar dates synchronized with external OTAs (Airbnb, Booking.com).
- **Payment & Gateway Handoff**: Handled securely via PhonePe payment protocol without exposing sensitive gateway keys in client bundles.

---

## 2. Screen Inventory

| Screen | Description |
|---|---|
| `SplashScreen` | Himalayan boutique brand crest, altitude indicator, and app hydration. |
| `HomeScreen` | Hero photography banner, quick availability date/guest selector, suite highlights, verified 4.9★ Google rating, and instant WhatsApp concierge. |
| `RoomsScreen` | Dedicated discovery of the 4 suites (Carmel, Jordan, Sion, Zion) with live seasonal rates. |
| `RoomDetailScreen` | High-definition photo carousel, complete room specifications, seasonal rates breakdown, and persistent booking bar. |
| `BookingScreen` | Full multi-step reservation suite: date selection with night calculation, room selection with real-time availability checks, guest stepper with capacity validation, meal planner (Breakfast, Lunch, Dinner with Veg/Non-Veg counts), and dynamic coupon validation. |
| `PaymentHandoffScreen` | Pre-flight itemized summary and secure PhonePe handoff / direct Supabase dual-write reservation creation. |
| `BookingConfirmationScreen` | Confirmed reservation voucher, booking ID, location directions, and host communication triggers. |
| `MyBookingsScreen` | Phone number lookup to view past and upcoming stays, live status, and invoice breakdowns. |
| `ContactScreen` | One-tap WhatsApp chat, host call links (`+91 83489 93048`, `+91 89109 11758`), and map directions. |
| `HomestayPoliciesScreen` | Comprehensive house rules, quiet hours, check-in/checkout timings, and cancellation terms. |

---

## 3. Development Setup & Execution

### Prerequisites
- Node.js (v18+)
- Expo CLI or `npx expo`

### Install Dependencies
```bash
cd mobile
npm install
```

### Run Locally
```bash
# Start Expo development server
npx expo start

# Run on Android Emulator or connected device
npx expo run:android

# Run on iOS Simulator (macOS only)
npx expo run:ios
```

---

## 4. Production Release & Build Instructions

### Android Build (APK / Google Play AAB)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build standalone Android APK for direct installation
eas build --platform android --profile preview

# Build production Android App Bundle (AAB) for Google Play Console
eas build --platform android --profile production
```

### iOS Build (TestFlight / Apple App Store IPA)
```bash
# Build production iOS IPA
eas build --platform ios --profile production
```
