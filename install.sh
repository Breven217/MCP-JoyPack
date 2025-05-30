#!/bin/bash

# Display welcome message
echo "===== MCP JoyPack Installer ====="
echo "This installer will set up MCP JoyPack on your Mac."
echo "The application requires permission to access files and run commands."

# Define installation paths and URLs
APP_NAME="MCP-JoyPack.app"
INSTALL_DIR="/Applications"
RELEASE_URL="https://github.com/Breven217/MCP-JoyPack/releases/latest/download/MCP-JoyPack-latest.dmg"
DMG_FILE="/tmp/MCP-JoyPack-latest.dmg"
MOUNT_POINT="/Volumes/MCP-JoyPack"

# Check if app is already installed
if [ -d "$INSTALL_DIR/$APP_NAME" ]; then
  echo "MCP JoyPack is already installed. Would you like to reinstall? (y/n)"
  read -r response
  if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Installation cancelled."
    exit 0
  fi
  echo "Removing previous installation..."
  rm -rf "$INSTALL_DIR/$APP_NAME"
fi

# Download the latest release
echo "Downloading the latest version of MCP JoyPack..."
curl -L "$RELEASE_URL" -o "$DMG_FILE"

# Mount the DMG file
echo "Mounting the disk image..."
hdiutil attach "$DMG_FILE" -nobrowse

# Copy the app to the Applications folder
echo "Installing application to $INSTALL_DIR..."
cp -R "$MOUNT_POINT/$APP_NAME" "$INSTALL_DIR/"

# Unmount the DMG
echo "Cleaning up..."
hdiutil detach "$MOUNT_POINT" -force

# Remove quarantine attribute
echo "Configuring security settings..."
xattr -dr com.apple.quarantine "$INSTALL_DIR/$APP_NAME"

# Create required directories
echo "Setting up required directories..."
mkdir -p "$HOME/.mcp"
mkdir -p "$HOME/.codeium/windsurf"

# Set permissions
echo "Setting permissions..."
chmod -R 755 "$HOME/.mcp"
chmod -R 755 "$HOME/.codeium/windsurf"

# Install Homebrew if missing
echo "Checking for Homebrew..."
if ! command -v brew &> /dev/null; then
  echo "Homebrew not found. Would you like to install it? (y/n)"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for the current session
    if [[ -f /opt/homebrew/bin/brew ]]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [[ -f /usr/local/bin/brew ]]; then
      eval "$(/usr/local/bin/brew shellenv)"
    fi
    
    echo "Homebrew installed successfully."
  else
    echo "Homebrew installation skipped. Some features will not work properly."
  fi
fi

# Check if git is installed, install if missing
echo "Checking for Git..."
if ! command -v git &> /dev/null; then
  echo "Git not found. Installing Git..."
  brew install git
fi

# Create a first-run helper script
echo "Creating helper scripts..."
cat > "$HOME/.mcp/first-run.sh" << 'EOL'
#!/bin/bash
# This script helps with first-run permission requests
echo "Preparing MCP JoyPack environment..."

# Test permissions by creating test files
touch "$HOME/.mcp/test-write.txt"
rm "$HOME/.mcp/test-write.txt"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Git is not installed. Please install Git before using MCP JoyPack."
    echo "You can install it with: brew install git"
    exit 1
fi

echo "Environment check complete. You can now launch MCP JoyPack."
EOL

chmod +x "$HOME/.mcp/first-run.sh"

# Run the first-run script
echo "Running first-time setup..."
$HOME/.mcp/first-run.sh

# Final instructions
echo ""
echo "===== Installation Complete ====="
echo "MCP JoyPack has been installed to your Applications folder."

# Automatically open the app
echo "Opening MCP JoyPack..."
# Use open command with -a flag to specify the application
open -a "$INSTALL_DIR/$APP_NAME"

echo "IMPORTANT: If prompted about an unidentified developer:"
echo "1. Click 'Cancel'"
echo "2. Right-click (or Control+click) on the MCP JoyPack app in Applications"
echo "3. Select 'Open' from the context menu"
echo "4. Click 'Open' when prompted"

echo ""
echo "When the app requests permissions to access files or run commands,"
echo "please approve these requests for the app to function properly."
echo ""
echo "Thank you for installing MCP JoyPack!"
