# Gologin Scraper

Node.js script to list GoLogin profiles, launch one or more existing browser profiles, and navigate each launched browser to a target URL.

## What the project does

The current script focuses on an existing-profile workflow:

- Reads the GoLogin API token from environment variables.
- Fetches profiles from the GoLogin API when no profile ID is provided.
- Launches a selected GoLogin browser profile.
- Opens a fresh tab, closes extra tabs, and navigates to a configurable URL.
- Logs basic page metadata after navigation, including the final URL and page title.
- Closes the browser cleanly after each run.

> Note: The code contains a helper for creating a new profile (`createNewProfile()`), but that helper is not wired into the main CLI flow yet.

## Requirements

- Node.js 18 or newer recommended.
- A valid GoLogin API token.
- At least one existing GoLogin profile in your workspace if you want to run the default “list and launch” flow.

## Installation

```bash
npm install
```

## Environment variables

The script supports these environment variables:

| Variable | Required | Description |
| --- | --- | --- |
| `GL_API_TOKEN` | Yes | GoLogin API token used for API and browser launch requests. |
| `GOLOGIN_PROFILE_ID` | No | Specific profile ID to launch. If omitted, the script fetches profile IDs from the API. |
| `TARGET_URL` | No | URL opened after the profile starts. Defaults to `https://ebay.com/`. |
| `PROFILE_LIMIT` | No | Number of fetched profiles to process when `GOLOGIN_PROFILE_ID` is not provided. Defaults to `1`. Use `0` to run all fetched profiles. |

### Example setup

macOS/Linux:

```bash
export GL_API_TOKEN="your_token_here"
export TARGET_URL="https://www.ebay.com/"
export PROFILE_LIMIT=1
```

Windows PowerShell:

```powershell
$env:GL_API_TOKEN = "your_token_here"
$env:TARGET_URL = "https://www.ebay.com/"
$env:PROFILE_LIMIT = "1"
```

## Usage

### 1. Launch a specific profile

By command line argument:

```bash
npm start -- your_profile_id_here
```

Or by environment variable:

```bash
export GOLOGIN_PROFILE_ID="your_profile_id_here"
npm start
```

### 2. Fetch profiles, then launch the newest profiles

If `GOLOGIN_PROFILE_ID` is not set, the script:

1. Calls the GoLogin profile listing API.
2. Prints up to 10 discovered profiles.
3. Launches up to `PROFILE_LIMIT` profiles from the fetched list.
4. Navigates each profile to `TARGET_URL`.
5. Prints a success/failure summary.

Run it with:

```bash
npm start
```

## Available npm scripts

```bash
npm start
npm run dev
```

- `npm start`: runs `node index.js`
- `npm run dev`: runs `node --watch index.js`

## Current code structure

All logic currently lives in `index.js`:

- `getProfiles()` fetches profile data from the GoLogin API.
- `displayProfiles()` prints a short profile list.
- `startProfile(profileId)` launches a GoLogin profile and returns the browser/page handles.
- `navigateAndCheckPage(page, url)` opens the target page and returns `{ url, title }`.
- `startProfiles(profiles, limit)` runs multiple profiles sequentially.
- `closeBrowser(browser)` closes each launched browser safely.
- `createNewProfile()` is available for future extension.

## Notes and limitations

- The script runs profiles sequentially, not in parallel.
- The current implementation does not persist custom flows per profile yet.
- The script depends on the GoLogin service and valid credentials, so it cannot run successfully in an environment without a real token/profile setup.

## Future improvements

Potential next steps based on the project goal:

1. Save reusable flows per profile ID.
2. Add configurable actions such as opening pages, searching, registering, or purchase-flow automation.
3. Split the single-file script into smaller modules.
4. Add automated tests with mocked GoLogin/API responses.
