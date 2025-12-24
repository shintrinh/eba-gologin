# Gologin Scraper

Anonymous scraping using Gologin API with Node.js

## Prerequisites

- Node.js (v14 or higher)
- Gologin API token (get from https://app.gologin.com/personalArea/TokenApi)
- Existing Gologin profiles (create at https://app.gologin.com/personalArea/Profiles)

## Installation

```bash
# Install dependencies
npm install
```

## Setup

1. Get your Gologin API token from [Settings > API](https://app.gologin.com/personalArea/TokenApi)

2. Set the environment variable with your token:

**On Windows (PowerShell):**
```powershell
$env:GL_API_TOKEN = "your_token_here"
```

**On Windows (CMD):**
```cmd
set GL_API_TOKEN=your_token_here
```

**On macOS/Linux:**
```bash
export GL_API_TOKEN=your_token_here
```

## Usage

### Start an Existing Profile

Get your profile ID from https://app.gologin.com/personalArea/Profiles

**Method 1: Command line argument**
```bash
npm start your_profile_id_here
```

**Method 2: Environment variable**
```powershell
$env:GOLOGIN_PROFILE_ID = "your_profile_id_here"
npm start
```

### Example

```powershell
$env:GL_API_TOKEN = "your_token_here"
npm start 65abc1234567890def123456
```

## Features

- ✅ Start existing profiles (no creation/deletion)
- ✅ Launch browser with Gologin proxy
- ✅ Navigate to websites with fingerprint protection
- ✅ Extract page data using JavaScript
- ✅ Proper error handling and logging
- ✅ Modular functions for easy customization

## API Reference

- **Get all profiles**: `gologin.getProfiles()` - Fetches all profiles from your workspace
- **Get workspace data**: `gologin.getWorkspaceData()` - Gets workspace information including profiles
- **Launch profile**: `gologin.launch({ profileId })` - Launches a profile and returns a Puppeteer browser instance
- **Create profile**: `gologin.createProfileRandomFingerprint()` - Creates new profile with random fingerprint
- **Delete profile**: `gologin.deleteProfile(profileId)` - Deletes a profile
- **Add proxy**: `gologin.addGologinProxyToProfile(profileId, 'US')` - Adds proxy to profile

## Documentation

- [Gologin API Reference](https://gologin.com/docs/api-reference)
- [Get all profiles in workspace](https://gologin.com/docs/api-reference/workspace/get-all-profiles-in-workspace)
- [Gologin Quickstart](https://gologin.com/docs/api-reference/introduction/quickstart)
- [Gologin Dashboard](https://app.gologin.com/)

# Chuc nang:
1. Lay danh sach profiles: Save lai token va profileID
2. Moi profileID se save lai cac flow: mo trang, dang ky, tim kiem, mua hang