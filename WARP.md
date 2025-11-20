# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a React Native mobile application (`Bidding_App`) that implements a dealer-focused live car auction experience. It uses:
- React Native 0.79 with TypeScript
- React Navigation (native stack + bottom tabs)
- Context providers for WebSocket-based live bidding and wishlist state
- A REST/WS backend hosted under `http://192.168.1.72:8086` and `https://caryanamindia.prodchunca.in.net`

Entry point is `index.js` → `App.tsx`.

## Key Commands

Run all commands from the repository root.

- Start Metro bundler only:
  - `npm run start`
- Run Android app (builds & installs debug build on connected/emulated device):
  - `npm run android`
- Run iOS app (requires macOS + Xcode):
  - `npm run ios`
- Lint source with ESLint:
  - `npm run lint`
- Run the Jest test suite:
  - `npm test`
- Run a single Jest test file (example for `__tests__/App.test.tsx`):
  - `npm test -- --runTestsByPath __tests__/App.test.tsx`
- Run tests matching a name pattern (Jest `-t`):
  - `npm test -- -t "renders correctly"`

The project targets Node `>=18` (see `package.json` engines).

## High-Level Architecture

### Top-Level Composition

- `index.js` registers the app with React Native, using `App` from `App.tsx`.
- `App.tsx` composes global providers and navigation:
  - Wraps the app in `WishlistProvider` (`src/context/WishlistContext.tsx`).
  - Wraps everything in `WebSocketProvider` (`src/utility/WebSocketConnection.tsx`).
  - Renders a `NavigationContainer` with the `AppNavigator` stack.
- `src/main.tsx` contains an older/alternative app composition using `SafeAreaProvider`; it is **not** currently wired into `index.js`. If you refactor global providers, prefer updating `App.tsx` and keep `main.tsx` in sync or remove it.

### Navigation Structure

- `src/components/appnavigator.tsx` defines the root stack (`RootStackParamList`) using `@react-navigation/native-stack`:
  - `Login` → dealer authentication screen (`src/screens/login/login_screen.tsx`).
  - `Home` → the main tabbed experience (`BottomNavigationScreen`).
  - `SignUp` → simplified registration flow.
  - `ForgotPassword` → password reset screen (`src/utility/ForgotPassword.tsx`).
  - `InspectionReport` → detailed inspection report for a specific car (`src/screens/mycars/InspectionReport.tsx`, expects `{ beadingCarId: string }`).
- `src/components/BottomNavigation/bottomnavigation_screen.tsx` uses a bottom tab navigator with five tabs:
  - `Home` → live auctions and bidding UI (`src/screens/home/home_screen.tsx`).
  - `MyCars` → dealer inventory and wishlist (`src/screens/mycars/mycars_screen.tsx`).
  - `Orders` → bids/orders status (`src/screens/orders/orders_screen.tsx`).
  - `WinZone` → final winning bids list (`src/screens/addons/addons_screen.tsx`).
  - `Account` → dealer profile and account info (`src/screens/account/account_screen.tsx`).

### State, Context, and Persistence

#### Wishlist

- `src/context/WishlistContext.tsx` exposes:
  - `wishlist: Set<string>`
  - `toggleWishlist(carId: string)`
  - `isWishlisted(carId: string): boolean`
- Persists the wishlist to `AsyncStorage` under the key `user_wishlist` and rehydrates it on startup.
- Consumed by feature screens such as:
  - `HomeScreen` to show heart icons on car cards and car-details modal.
  - `MyCarsScreen` to drive the "Wishlist" tab and card heart state.

#### WebSocket & Live Data

- `src/utility/WebSocketConnection.tsx` implements a `WebSocketProvider` and `useWebSocket()` hook that centralizes all bidding-related connectivity and live data.
- Responsibilities:
  - Manage auth token for WS/HTTP (stored as `auth_token` in `AsyncStorage`).
  - Establish both:
    - A plain `WebSocket` connection against `API_ENDPOINT_WS` for general live updates.
    - A STOMP client (`@stomp/stompjs`) subscribing to `/topic/liveCars` for live car lists and updates.
  - Provide derived state and operations via context:
    - Connection flags: `isConnected`, `isAuthenticated`, `connectionStatus`, `connectionError`.
    - Data: `liveCars`, `topThreeBidsAmount`, `topThreeBidsAmountArray` (some of which are currently placeholders).
    - Commands: `connectWebSocket(authToken?)`, `disconnectWebSocket()`, `getLiveCars()`, `placeBid(userData)`.
  - Fetch initial live cars via HTTP (currently hitting `API_ENDPOINT_WS` with `GET`, see `fetchLiveCarsViaHTTP`).
  - Handle reconnection with a capped retry strategy.
- Any screen that needs live auction data or to place bids should go through `useWebSocket()` rather than creating its own WebSocket connections.

#### Auth & Shared Storage Keys

Several screens cooperate via shared `AsyncStorage` keys:

- `Login` (`src/screens/login/login_screen.tsx`):
  - On successful JWT login, parses token claims and stores:
    - `auth_token`, `user_id`, `user_email`, `dealerId`, and a serialized `userData` object.
  - Immediately calls `connectWebSocket(token)` so the WebSocket layer knows about the auth token.
  - Enforces that only users with a dealer ID can proceed to the app (otherwise shows an access denied alert).
- `HomeScreen` reads:
  - `auth_token` and `user_id` from `AsyncStorage` if no route params are passed.
  - Uses these to call `connectWebSocket(token)` and to authorize bid placement.
- `MyCarsScreen` uses `userData`, `user_id`, and `dealerId` to fetch dealer-specific inventory.
- `AccountScreen` decodes `auth_token` to get dealer and user IDs for profile and profile-photo APIs.

Be careful to keep these key names consistent across features when changing auth flows.

## Feature-Level Architecture

### Home / Live Auctions

- File: `src/screens/home/home_screen.tsx`
- This is the most complex screen and the primary consumer of WebSocket + REST data.
- Responsibilities:
  - Initialize `connectWebSocket(token)` when a user logs in or when a stored token is found.
  - Use `useWebSocket()` to:
    - Read `liveCars` and connection state.
    - Trigger `getLiveCars()` after the WebSocket connection is established.
  - Maintain additional client-side state:
    - Auction timers per car (`carAuctionTimes`, `countdownTimers`) with a `setInterval`-based tick.
    - `livePrices` (polling per-car via `Bid/getliveValue?bidCarId=...`).
    - Car images and detailed data (via `uploadFileBidCar/getByBidCarID` and `BeadingCarController/getByBidCarId/...`).
    - Bid modal state and validation, including optimistic refresh of live prices after placing a bid.
    - A local notification system for bid events (`bid`, `outbid`, `won`, `time`) with animated banners.
  - Derive the list of currently displayable `filteredLiveCars` based on auction end-times and countdown.
  - Bridge into inspection details by navigating to `InspectionReport` with a given `beadingCarId` from the car details modal.

When changing auction semantics (timers, pricing, cars list), this is the core file to update together with `WebSocketConnection`.

### MyCars / Dealer Inventory

- File: `src/screens/mycars/mycars_screen.tsx`
- Focused on the dealer’s own cars, fetched from `BeadingCarController/getByDealerID/{dealerId}`.
- Flow:
  - Reads `userData`, `user_id`, and `dealerId` from `AsyncStorage` to identify the dealer; if missing, navigates back with appropriate alerts.
  - Fetches all cars for the dealer, normalizing IDs and shapes into a unified `Car` type.
  - Immediately renders cards and then asynchronously pre-fetches image URLs per car from `uploadFileBidCar/getByBidCarID`.
- UI:
  - Uses animated refresh icon and top tabs: `Live bid`, `OCB nego`, `Wishlist`.
  - Uses `useWishlist()` to filter the "Wishlist" tab and to render heart icons on cards.
  - Card tap opens a modal with:
    - Horizontally scrollable gallery of car images.
    - "Know your car" summary, features, and location info.
    - A link into `InspectionReport` (navigating with the car's `beadingCarId`/`bidCarId`/`id`).

### Inspection Reports

- File: `src/screens/mycars/InspectionReport.tsx`
- Accepts `beadingCarId` via route params and fetches an inspection report from:
  - `inspectionReport/getByBeadingCar?beadingCarId=...`.
- Maintains a tabbed interface (`Document`, `Exterior`, `Interior`, `Engine`, `AC`, `Electricals`, `Engine Video`, `Steering`).
  - `Document` is a generic key-to-label map over the root report object.
  - Other tabs delegate to specialized section components (e.g. `ExteriorSection`, `EngineSection`).

### Orders

- File: `src/screens/orders/orders_screen.tsx`
- Uses static demo data for "Lost" cars and scaffolding for other states (`In Negotiation`, `Procured`, `RC Transfer`).
- Provides navigation back to `Home` when there are no ongoing negotiations.
- This screen is logically separate from the live bidding views and can be evolved independently into a real orders pipeline.

### WinZone / Final Bids

- File: `src/screens/addons/addons_screen.tsx` (tab name: `WinZone`)
- Fetches finalized bids from `Bid/finalBids` using the stored `auth_token`.
- Sorts by `updatedAt` or `finalBidId` and paginates using `FlatList` with `onEndReached`.
- Uses per-item animations on entry and a modal for inspecting details (price, buyer/seller IDs, beading car id).

### Account / Profile

- File: `src/screens/account/account_screen.tsx` with styles in `AccountScreen.styles.ts`.
- Decodes `auth_token` to get `dealerId` and `userId`.
- Fetches:
  - Dealer info from `dealer/{dealerId}`.
  - Profile photo binary from `ProfilePhoto/getbyuserid?userId=...`.
- Provides:
  - Modal for viewing/editing profile details and managing profile photo via `ProfilePhoto/add` and `ProfilePhoto/deletebyuserid`.
  - Logout flow that clears `auth_token` and redirects to `Login`.

### Auth-Related Screens

- `src/screens/login/login_screen.tsx`:
  - Handles JWT login against `jwt/login`.
  - Persists token and derived data to `AsyncStorage` (see keys above).
  - Starts WebSocket connection and navigates to `Home` on success.
- `src/utility/ForgotPassword.tsx`:
  - Standalone stack screen invoked from Login.
  - Posts to `cars/forgot-password` with the entered email and returns the user to `Login` on success.
- `src/screens/signup/signup_screen.tsx`:
  - Pure client-side form; on success it currently just navigates to `Home` without hitting an API.

## Types, Declarations, and Tooling

- Type declarations:
  - `src/declarations.d.ts` and `src/types/css.d.ts` allow importing PNG assets and CSS modules.
  - `src/react-native-linear-gradient.d.ts` and `src/react-native-vector-icons.d.ts` provide basic typings for third-party UI libraries.
- Jest:
  - Configured via `jest.config.js` with `preset: 'react-native'`.
  - Example test file: `__tests__/App.test.tsx` renders `<App />`.
- Linting & formatting:
  - ESLint root config extends `@react-native` (`.eslintrc.js`).
  - Prettier options are in `.prettierrc.js` and are aligned with React Native defaults (single quotes, trailing commas, etc.).

## Notes for Future Agents

- The live-bidding flow crosses several files (`Login`, `WebSocketConnection`, `HomeScreen`, `MyCarsScreen`, `InspectionReport`, `AddOnsScreen`). When changing API contracts or auth token handling, update these together.
- Network endpoints are hard-coded across multiple screens; prefer centralizing base URLs in a single utility if you plan to refactor them.
- There is an unused `mycars_context.tsx` placeholder; if you introduce additional shared state for the "My Cars" feature, that is the natural place for a new context provider.