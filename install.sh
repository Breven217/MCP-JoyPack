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
print_header "MCP JoyPack Installer v0.1.0"
print_info "This installer will set up MCP JoyPack on your Mac."
print_info "The application requires permission to access files and run commands."

# Define installation paths and URLs
INSTALL_DIR="/Applications"
RELEASE_URL="https://github.com/Breven217/MCP-JoyPack/releases/latest/download/MCP-JoyPack-latest.dmg"
DMG_FILE="/tmp/MCP-JoyPack-latest.dmg"

# The mount point might vary based on the DMG label
# We'll detect it after mounting

# We'll determine the app name after mounting
APP_NAME="mcp-joypack.app"

# Check if app is already installed (check both capitalization variants)
if [ -d "$INSTALL_DIR/$APP_NAME" ] || [ -d "$INSTALL_DIR/MCP-JoyPack.app" ]; then
  EXISTING_APP="$APP_NAME"
  if [ -d "$INSTALL_DIR/MCP-JoyPack.app" ]; then
    EXISTING_APP="MCP-JoyPack.app"
  fi
  
  print_warning "MCP JoyPack is already installed. Would you like to reinstall? (y/n)"
  read -r response
  if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    print_info "Installation cancelled."
    exit 0
  fi
  print_info "Removing previous installation..."
  rm -rf "$INSTALL_DIR/$EXISTING_APP"
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
  print_warning "Please try again or install manually."
  exit 1
fi

# Set the full path to the mount point
MOUNT_POINT="/Volumes/$MOUNT_POINT"
print_success "Using mount point: $MOUNT_POINT"

# List contents of the mounted volume
print_info "Contents of $MOUNT_POINT:"
ls -la "$MOUNT_POINT" || true

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
APP_NAME=$(basename "$APP_PATH")
print_success "Found application: $APP_NAME"

# Copy the app to the Applications folder
print_header "Installing"
print_info "Installing application to $INSTALL_DIR..."
if ! cp -R "$APP_PATH" "$INSTALL_DIR/"; then
  print_error "Failed to copy the application to $INSTALL_DIR."
  hdiutil detach "$MOUNT_POINT" -force 2>/dev/null || true
  exit 1
fi

# Verify the app was copied successfully
if [ ! -d "$INSTALL_DIR/$APP_NAME" ]; then
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
xattr -dr com.apple.quarantine "$INSTALL_DIR/$APP_NAME"
print_success "Security attributes removed."

# Create required directories
print_header "Directory Setup"
print_info "Setting up required directories..."
mkdir -p "$HOME/.mcp"
mkdir -p "$HOME/.codeium/windsurf"
print_success "Directories created successfully."

# Set permissions
print_info "Setting permissions..."
chmod -R 755 "$HOME/.mcp"
chmod -R 755 "$HOME/.codeium/windsurf"
print_success "Permissions set successfully."

# Create a permissions file for Homebrew and Node operations
print_header "Permission Setup"
print_info "Setting up permissions for Homebrew and Node..."
cat > "$HOME/.mcp/brew_permissions.sh" << 'EOL'
#!/bin/bash
# This script grants permissions for Homebrew and Node operations

# Ensure Homebrew directory has correct permissions
if [ -d "/opt/homebrew" ]; then
  # For Apple Silicon Macs
  sudo chown -R $(whoami):admin /opt/homebrew
  sudo chmod -R 755 /opt/homebrew
elif [ -d "/usr/local/Homebrew" ]; then
  # For Intel Macs
  sudo chown -R $(whoami):admin /usr/local/Homebrew
  sudo chmod -R 755 /usr/local/Homebrew
fi

# Ensure global npm directory has correct permissions
NPM_PREFIX=$(npm config get prefix)
if [ -n "$NPM_PREFIX" ]; then
  sudo chown -R $(whoami):admin "$NPM_PREFIX"
  sudo chmod -R 755 "$NPM_PREFIX"
fi

echo "Permissions set successfully."
EOL

chmod +x "$HOME/.mcp/brew_permissions.sh"
print_success "Permission script created."

# Install Homebrew if missing
print_header "Homebrew Setup"
print_info "Checking for Homebrew..."
if ! command -v brew &> /dev/null; then
  print_warning "Homebrew not found. Would you like to install it? (y/n)"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    print_info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for the current session
    if [[ -f /opt/homebrew/bin/brew ]]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [[ -f /usr/local/bin/brew ]]; then
      eval "$(/usr/local/bin/brew shellenv)"
    fi
    
    print_success "Homebrew installed successfully."
  else
    print_warning "Homebrew installation skipped. Some features will not work properly."
  fi
else
  print_success "Homebrew is already installed."
fi

# Set proper permissions for Homebrew directories
print_info "Setting up Homebrew permissions..."
if [ -d "/opt/homebrew" ]; then
  # For Apple Silicon Macs
  print_info "Setting permissions for /opt/homebrew..."
  sudo chown -R $(whoami):admin /opt/homebrew 2>/dev/null || true
  sudo chmod -R 755 /opt/homebrew 2>/dev/null || true
  print_success "Permissions set for /opt/homebrew"
elif [ -d "/usr/local/Homebrew" ]; then
  # For Intel Macs
  print_info "Setting permissions for /usr/local/Homebrew..."
  sudo chown -R $(whoami):admin /usr/local/Homebrew 2>/dev/null || true
  sudo chmod -R 755 /usr/local/Homebrew 2>/dev/null || true
  print_success "Permissions set for /usr/local/Homebrew"
fi

# Check if git is installed, install if missing
print_header "Git Setup"
print_info "Checking for Git..."
if ! command -v git &> /dev/null; then
  print_warning "Git not found. Installing Git..."
  brew install git
  if command -v git &> /dev/null; then
    print_success "Git installed successfully."
  else
    print_error "Failed to install Git. You may need to install it manually."
  fi
else
  print_success "Git is already installed."
fi

# Create a first-run helper script
print_header "Helper Scripts"
print_info "Creating helper scripts..."
cat > "$HOME/.mcp/first-run.sh" << 'EOL'
#!/bin/bash
# This script helps with first-run permission requests

# Define colors for better visibility
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
BOLD="\033[1m"
RESET="\033[0m"

# Function to print colored messages
print_message() {
  local color=$1
  local message=$2
  echo -e "${color}${message}${RESET}"
}

print_header() {
  echo -e "\n${BOLD}${BLUE}===== $1 =====${RESET}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${RESET}"
}

print_error() {
  echo -e "${RED}✗ $1${RESET}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${RESET}"
}

print_info() {
  echo -e "${CYAN}ℹ $1${RESET}"
}

print_header "MCP JoyPack Environment Setup"
print_info "Preparing MCP JoyPack environment..."

# Test permissions by creating test files
touch "$HOME/.mcp/test-write.txt"
rm "$HOME/.mcp/test-write.txt"
print_success "File system permissions verified."

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git before using MCP JoyPack."
    print_info "You can install it with: brew install git"
    exit 1
fi
print_success "Git is installed."

# Set up Homebrew permissions
print_header "Homebrew Permissions"
print_info "Setting up Homebrew permissions..."
if [ -d "/opt/homebrew" ]; then
    # For Apple Silicon Macs
    print_info "Setting permissions for /opt/homebrew..."
    sudo chown -R $(whoami):admin /opt/homebrew 2>/dev/null || true
    sudo chmod -R 755 /opt/homebrew 2>/dev/null || true
    print_success "Permissions set for /opt/homebrew"
elif [ -d "/usr/local/Homebrew" ]; then
    # For Intel Macs
    print_info "Setting permissions for /usr/local/Homebrew..."
    sudo chown -R $(whoami):admin /usr/local/Homebrew 2>/dev/null || true
    sudo chmod -R 755 /usr/local/Homebrew 2>/dev/null || true
    print_success "Permissions set for /usr/local/Homebrew"
fi

# Set up global npm directory permissions if it exists
print_header "NPM Configuration"
if [ -d "$HOME/.npm-global" ]; then
    print_info "Setting permissions for npm global directory..."
    chmod -R 755 "$HOME/.npm-global" 2>/dev/null || true
    print_success "NPM global permissions set."
fi

# Create a .npmrc file to set up a custom global directory if it doesn't exist
if [ ! -f "$HOME/.npmrc" ]; then
    print_info "Setting up npm configuration..."
    mkdir -p "$HOME/.npm-global"
    echo "prefix=$HOME/.npm-global" > "$HOME/.npmrc"
    chmod 644 "$HOME/.npmrc"
    print_success "NPM configuration created."
fi

print_header "Setup Complete"
print_success "Environment setup complete. You can now launch MCP JoyPack."
EOL

chmod +x "$HOME/.mcp/first-run.sh"
print_success "Helper scripts created successfully."

# Run the first-run script
print_header "First-Time Setup"
print_info "Running first-time setup..."
$HOME/.mcp/first-run.sh

# Final instructions
print_header "Installation Complete"
print_success "MCP JoyPack has been installed to your Applications folder."

# Automatically open the app
print_info "Opening MCP JoyPack..."
open -a "$INSTALL_DIR/$APP_NAME"

print_warning "IMPORTANT: If prompted about an unidentified developer:"
print_info "1. Click 'Cancel'"
print_info "2. Right-click (or Control+click) on the MCP JoyPack app in Applications"
print_info "3. Select 'Open' from the context menu"
print_info "4. Click 'Open' when prompted"

print_warning "When the app requests permissions to access files or run commands,"
print_warning "please approve these requests for the app to function properly."

print_header "Thank You"
print_success "Thank you for installing MCP JoyPack v0.1.2!"
