#!/bin/bash

# This script helps create a development build of your app
# with notifications properly supported

# Make sure EAS CLI is installed
if ! command -v eas &> /dev/null
then
    echo "EAS CLI not found, installing..."
    npm install -g eas-cli
fi

# Login to EAS (if needed)
eas whoami || eas login

# Create or update eas.json if it doesn't exist
if [ ! -f eas.json ]; then
    echo "Creating eas.json configuration file..."
    cat > eas.json << 'EOL'
{
  "cli": {
    "version": ">= 3.13.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
EOL
fi

# Create development build for Android or iOS based on argument
if [ "$1" = "android" ]; then
    echo "Creating Android development build..."
    eas build --platform android --profile development
elif [ "$1" = "ios" ]; then
    echo "Creating iOS development build..."
    eas build --platform ios --profile development
else
    echo "Usage: ./create-dev-build.sh [android|ios]"
    echo "Please specify platform: android or ios"
    exit 1
fi

echo "Once your build is complete, install it on your device to test notifications properly." 