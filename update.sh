#!/bin/bash

# Define colors for better visibility
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
BOLD="\033[1m"
RESET="\033[0m"

# Function to print colored messages
print_message() {
  local color=$1
  local message=$2
  echo -e "${color}${message}${RESET}"
}

# Function to print section headers
print_header() {
  local message=$1
  echo -e "\n${BOLD}${BLUE}===== ${message} =====${RESET}\n"
}

# Function to print success messages
print_success() {
  local message=$1
  echo -e "${GREEN}✓ ${message}${RESET}"
}

# Function to print error messages
print_error() {
  local message=$1
  echo -e "${RED}✗ ${message}${RESET}"
}

# Function to print warning messages
print_warning() {
  local message=$1
  echo -e "${YELLOW}⚠ ${message}${RESET}"
}

# Function to print info messages
print_info() {
  local message=$1
  echo -e "${CYAN}ℹ ${message}${RESET}"
}

# Display welcome message
print_header "MCP JoyPack Updater"
print_info "This script will update MCP JoyPack to the latest version."

# Define installation paths and URLs
INSTALL_DIR="/Applications"
RELEASE_URL="https://github.com/Breven217/MCP-JoyPack/releases/latest/download/MCP-JoyPack-latest.dmg"
DMG_FILE="/tmp/MCP-JoyPack-latest.dmg"

# Check for existing installations (check both capitalization variants)
if [ -d "$INSTALL_DIR/mcp-joypack.app" ]; then
  EXISTING_APP="mcp-joypack.app"
elif [ -d "$INSTALL_DIR/MCP-JoyPack.app" ]; then
  EXISTING_APP="MCP-JoyPack.app"
else
  print_error "MCP JoyPack is not currently installed."
  print_info "Please run the installation script instead."
  exit 1
fi

print_success "Found existing installation: $INSTALL_DIR/$EXISTING_APP"

# Check if the app is running
print_info "Checking if MCP JoyPack is currently running..."
if pgrep -f "$EXISTING_APP" > /dev/null; then
  print_warning "MCP JoyPack is currently running. It will be closed before updating."
  print_info "Closing MCP JoyPack..."
  osascript -e "tell application \"$INSTALL_DIR/$EXISTING_APP\" to quit"
  sleep 2
fi

# Download the latest release
print_header "Downloading"
print_info "Downloading the latest version of MCP JoyPack..."
curl -L "$RELEASE_URL" -o "$DMG_FILE"

# Mount the DMG file
print_header "Mounting"
print_info "Mounting the disk image..."
MOUNT_INFO=$(hdiutil attach "$DMG_FILE" -nobrowse)
echo "$MOUNT_INFO"

# Extract the mount point from the output
MOUNT_POINT=$(echo "$MOUNT_INFO" | tail -1 | awk '{print $3}')
if [ -z "$MOUNT_POINT" ]; then
  print_error "Could not determine the mount point."
  hdiutil detach "$DMG_FILE" -force 2>/dev/null || true
  exit 1
fi

print_success "Mounted at: $MOUNT_POINT"

# Check if the mount point exists and contains "mcp" or "joypack" in its name
MOUNT_POINT=$(ls -1 /Volumes/ | grep -i "mcp\|joypack" | head -1)
if [ -z "$MOUNT_POINT" ]; then
  print_error "Could not find a mounted volume with MCP or JoyPack in its name."
  print_info "Available volumes:"
  ls -la /Volumes/
  print_info "Unmounting any previous DMG..."
  hdiutil detach "$DMG_FILE" -force 2>/dev/null || true
  print_warning "Please try again or update manually."
  exit 1
fi

# Set the full path to the mount point
MOUNT_POINT="/Volumes/$MOUNT_POINT"
print_success "Using mount point: $MOUNT_POINT"

# Find the app in the mounted volume - ONLY look for mcp-joypack or MCP-JoyPack apps
print_header "Finding Application"
print_info "Searching for MCP JoyPack app in $MOUNT_POINT..."
APP_PATH=$(find "$MOUNT_POINT" -name "*[mM][cC][pP]*[jJ][oO][yY][pP][aA][cC][kK]*.app" -maxdepth 2 2>/dev/null | head -1)

# If not found, try a more general search but verify the app name contains mcp or joypack
if [ -z "$APP_PATH" ]; then
  print_warning "No exact match found. Searching for any app in $MOUNT_POINT..."
  for app in $(find "$MOUNT_POINT" -name "*.app" -maxdepth 2 2>/dev/null); do
    app_name=$(basename "$app" | tr '[:upper:]' '[:lower:]')
    if [[ "$app_name" == *"mcp"* ]] || [[ "$app_name" == *"joypack"* ]]; then
      APP_PATH="$app"
      print_success "Found MCP JoyPack app: $APP_PATH"
      break
    fi
  done
fi

# If still not found, exit with error
if [ -z "$APP_PATH" ]; then
  print_error "Could not find MCP JoyPack app in the mounted disk image."
  print_info "This is what was found in the mounted volume:"
  find "$MOUNT_POINT" -type f -maxdepth 3 | grep -v ".DS_Store"
  hdiutil detach "$MOUNT_POINT" -force 2>/dev/null || true
  exit 1
fi

print_success "Found app at: $APP_PATH"

# Extract just the app name from the path
NEW_APP_NAME=$(basename "$APP_PATH")
print_success "Found application: $NEW_APP_NAME"

# Remove the existing app
print_header "Updating"
print_info "Removing previous version..."
rm -rf "$INSTALL_DIR/$EXISTING_APP"

# Copy the app to the Applications folder
print_info "Installing updated version to $INSTALL_DIR..."
if ! cp -R "$APP_PATH" "$INSTALL_DIR/"; then
  print_error "Failed to copy the application to $INSTALL_DIR."
  hdiutil detach "$MOUNT_POINT" -force 2>/dev/null || true
  exit 1
fi

# Verify the app was copied successfully
if [ ! -d "$INSTALL_DIR/$NEW_APP_NAME" ]; then
  print_error "Application was not copied successfully to $INSTALL_DIR."
  hdiutil detach "$MOUNT_POINT" -force 2>/dev/null || true
  exit 1
fi

# Unmount the DMG and remove temporary files
print_header "Cleanup"
print_info "Cleaning up..."
hdiutil detach "$MOUNT_POINT" -force 2>/dev/null || true

# Remove the downloaded DMG file
if [ -f "$DMG_FILE" ]; then
  rm "$DMG_FILE"
  print_success "Removed temporary DMG file."
fi

# Remove quarantine attribute
print_header "Security Configuration"
print_info "Configuring security settings..."
xattr -dr com.apple.quarantine "$INSTALL_DIR/$NEW_APP_NAME"
print_success "Security attributes removed."

# Final instructions
print_header "Update Complete"
print_success "MCP JoyPack has been updated to the latest version."

# Automatically restart the app
print_info "Restarting MCP JoyPack..."

# Add a small delay to ensure everything is ready
sleep 1

# Launch the updated app
open -a "$INSTALL_DIR/$NEW_APP_NAME"

print_warning "IMPORTANT: If prompted about an unidentified developer:"
print_info "1. Click 'Cancel'"
print_info "2. Right-click (or Control+click) on the MCP JoyPack app in Applications"
print_info "3. Select 'Open' from the context menu"
print_info "4. Click 'Open' when prompted"

print_header "Thank You"
print_success "Thank you for updating MCP JoyPack!"
