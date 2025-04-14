# NutriNest - Smart Meal Planner App

NutriNest is a comprehensive meal planning and nutrition tracking application built with Expo React Native and Firebase. The app helps users plan their meals according to their dietary preferences, fitness goals, and budget.

## Features

- **User Authentication**: Email/password signup and login using Firebase Authentication
- **User Profile Management**: Set dietary preferences, fitness goals, allergies, and meal types
- **Personalized Meal Plans**: Generate meal plans based on user preferences using Spoonacular API
- **Nutrition Tracking**: Display calories, protein, carbs, and fats for meals
- **Calorie & Macronutrient Visualization**: Track daily intake with interactive charts
- **Meal Reminders**: Set notifications for meal times and grocery shopping
- **Budget-Friendly Meal Options**: Filter meals by cost to find affordable options

## Project Structure

```
nutrinest/
├── app/                  # Main application screens (Expo Router)
│   ├── (auth)/           # Authentication screens
│   ├── (tabs)/           # Main app tab screens
│   ├── _layout.tsx       # Root layout & auth state handling
│   └── profile-setup.tsx # User profile setup
├── assets/               # Images, fonts, and other static assets
├── components/           # Reusable UI components
├── config/               # Configuration files
│   └── firebaseConfig.js # Firebase configuration
├── constants/            # App constants and theme settings
├── hooks/                # Custom React hooks
├── services/             # API and business logic
│   ├── authService.js           # Authentication functions
│   ├── mealPlannerService.js    # Meal planning logic
│   ├── notificationService.js   # Notification handling
│   ├── nutritionTrackerService.js # Nutrition tracking
│   ├── spoonacularService.js    # Spoonacular API integration
│   └── userProfileService.js    # User profile management
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- Expo CLI
- Firebase account
- Spoonacular API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/nutrinest.git
   cd nutrinest
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure Firebase:
   - Create a Firebase project in the Firebase Console
   - Enable Authentication with Email/Password
   - Create a Firestore database
   - Copy your Firebase config to `config/firebaseConfig.js`

4. Configure Spoonacular API:
   - Get an API key from [Spoonacular](https://spoonacular.com/food-api)
   - Update the API key in `services/spoonacularService.js`

5. Start the development server:
   ```
   npx expo start
   ```

## Running on Mobile

1. Install the Expo Go app on your mobile device
2. Scan the QR code from the terminal or Expo Dev Tools
3. The app will load on your device

## Building for Production

To create a production build:

```
eas build --platform ios
eas build --platform android
```

## Dependencies

- Expo SDK
- React Native
- Firebase (Auth & Firestore)
- React Native Paper (UI Components)
- React Native Chart Kit (Charts)
- Expo Notifications (Reminders)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
