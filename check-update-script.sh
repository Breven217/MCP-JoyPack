#!/bin/bash

# Define colors for better visibility
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
BOLD="\033[1m"
RESET="\033[0m"

# Function to print colored messages
print_success() {
  echo -e "${GREEN}✓ $1${RESET}"
}

print_error() {
  echo -e "${RED}✗ $1${RESET}"
}

print_info() {
  echo -e "${CYAN}ℹ $1${RESET}"
}

print_header() {
  echo -e "\n${BOLD}${BLUE}===== $1 =====${RESET}\n"
}

# Check if .mcp directory exists
print_header "Update Script Check"

if [ -d "$HOME/.mcp" ]; then
  print_success "Directory $HOME/.mcp exists"
else
  print_error "Directory $HOME/.mcp does not exist"
  print_info "Creating directory..."
  mkdir -p "$HOME/.mcp"
  if [ -d "$HOME/.mcp" ]; then
    print_success "Directory created successfully"
  else
    print_error "Failed to create directory"
    exit 1
  fi
fi

# Check if update script exists
if [ -f "$HOME/.mcp/update.sh" ]; then
  print_success "Update script exists at $HOME/.mcp/update.sh"
  
  # Check if it's executable
  if [ -x "$HOME/.mcp/update.sh" ]; then
    print_success "Update script is executable"
  else
    print_error "Update script is not executable"
    print_info "Setting executable permission..."
    chmod +x "$HOME/.mcp/update.sh"
    if [ -x "$HOME/.mcp/update.sh" ]; then
      print_success "Executable permission set successfully"
    else
      print_error "Failed to set executable permission"
    fi
  fi
  
  # Check if it has content
  if [ -s "$HOME/.mcp/update.sh" ]; then
    print_success "Update script has content"
    print_info "First few lines of the script:"
    head -n 5 "$HOME/.mcp/update.sh"
  else
    print_error "Update script is empty"
  fi
else
  print_error "Update script does not exist at $HOME/.mcp/update.sh"
  
  # Check if update script exists in current directory
  if [ -f "$(dirname "$0")/update.sh" ]; then
    print_info "Found update script in current directory"
    print_info "Copying to $HOME/.mcp/update.sh..."
    cp "$(dirname "$0")/update.sh" "$HOME/.mcp/update.sh"
    chmod +x "$HOME/.mcp/update.sh"
    if [ -f "$HOME/.mcp/update.sh" ] && [ -x "$HOME/.mcp/update.sh" ]; then
      print_success "Update script copied and set as executable"
    else
      print_error "Failed to copy update script"
    fi
  else
    print_error "Update script not found in current directory"
    print_info "Downloading from GitHub..."
    curl -L "https://raw.githubusercontent.com/Breven217/MCP-JoyPack/main/update.sh" -o "$HOME/.mcp/update.sh"
    chmod +x "$HOME/.mcp/update.sh"
    if [ -f "$HOME/.mcp/update.sh" ] && [ -s "$HOME/.mcp/update.sh" ]; then
      print_success "Update script downloaded and installed"
    else
      print_error "Failed to download update script"
    fi
  fi
fi

print_header "Summary"
if [ -f "$HOME/.mcp/update.sh" ] && [ -x "$HOME/.mcp/update.sh" ] && [ -s "$HOME/.mcp/update.sh" ]; then
  print_success "Update script is properly installed and ready to use"
  print_info "You can run it manually with: bash $HOME/.mcp/update.sh"
else
  print_error "Update script is not properly set up"
  print_info "Please check the errors above and fix them"
fi
