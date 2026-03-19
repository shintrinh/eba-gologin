import { GologinApi } from 'gologin';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const config = {
  apiToken: process.env.GL_API_TOKEN,
  targetUrl: process.env.TARGET_URL || 'https://ebay.com/',
  profileLimit: Number.parseInt(process.env.PROFILE_LIMIT || '1', 10),
};

const token = config.apiToken;
console.log('Using GL_API_TOKEN:', token ? '✅ Set' : '❌ Not Set');

if (!token || token === 'your_dev_token_here') {
  console.error('❌ Error: GL_API_TOKEN not set or is placeholder value');
  process.exit(1);
}

const gologin = GologinApi({
  token,
});

async function getProfiles() {
  try {
    console.log('\n📋 Fetching profiles list from API...');

    const response = await fetch(
      'https://api.gologin.com/browser/v2?page=1&sorterField=createdAt&sorterOrder=descend',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Handle response structure
    const profiles = data.profiles || data.data || [];

    if (!Array.isArray(profiles)) {
      throw new Error('Invalid response format from API');
    }

    console.log(`✅ Found ${profiles.length} profile(s)`);
    displayProfiles(profiles);
    return profiles;
  } catch (error) {
    console.error('\n❌ Error fetching profiles');
    throw error;
  }
}

/**
 * Display profiles in a readable format
 */
function displayProfiles(profiles) {
  if (!profiles || profiles.length === 0) return;

  console.log('\n📋 Available profiles:');
  profiles.slice(0, 10).forEach((profile, index) => {
    const profileId = profile.id || profile.profileId;
    const name = profile.name || 'Unnamed';
    console.log(`  ${index + 1}. [${profileId}] ${name}`);
  });

  if (profiles.length > 10) {
    console.log(`  ... and ${profiles.length - 10} more profiles`);
  }
}

/**
 * Start an existing profile
 * @param {string} profileId - The profile ID to start
 * @returns {Object} Object containing success status, profileId, browser and page
 */
async function startProfile(profileId) {
  if (!profileId) {
    throw new Error('Profile ID is required');
  }

  try {
    console.log(`\n🚀 Starting profile: ${profileId}`);

    // Launch the profile browser
    const { browser } = await gologin.launch({ profileId });
    console.log('✅ Browser launched successfully');

    // Open a new page in the browser.
    const page = await browser.newPage();
    console.log('✅ New page created');

    // Close all other pages, keep only the new one.
    const allPages = await browser.pages();
    for (const currentPage of allPages) {
      if (currentPage !== page) {
        await currentPage.close();
      }
    }
    console.log('✅ Closed all other pages');

    return { success: true, profileId, browser, page };
  } catch (error) {
    console.error('\n❌ Error occurred while running profile');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.message) {
      console.error('Message:', error.message);
    } else {
      console.error('Error:', JSON.stringify(error, null, 2));
    }
    throw error;
  }
}

/**
 * Navigate page to website and collect page metadata
 * @param {Object} page - Puppeteer page object
 * @param {string} url - URL to navigate to (default: from config.targetUrl)
 * @returns {Object} Navigation result with URL and title
 */
async function navigateAndCheckPage(page, url = config.targetUrl) {
  try {
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    const title = await page.title();
    const currentUrl = page.url();
    const status = {
      url: currentUrl,
      title,
    };

    console.log('✅ Page loaded');
    console.log(`🔎 Title: ${title || '(empty title)'}`);
    console.log(`🔗 URL: ${currentUrl}`);

    return status;
  } catch (error) {
    console.error('\n❌ Error occurred while navigating page');
    throw error;
  }
}

async function closeBrowser(browser) {
  if (!browser) {
    return;
  }

  try {
    await browser.close();
    console.log('🧹 Browser closed');
  } catch (error) {
    console.warn('⚠️ Could not close browser cleanly:', error.message);
  }
}

/**
 * Start profiles from the list
 * @param {Array} profiles - Array of profile objects
 * @param {number} limit - Maximum number of profiles to run (0 = all)
 */
async function startProfiles(profiles, limit = 1) {
  const profilesToRun = limit > 0 ? profiles.slice(0, limit) : profiles;
  const results = [];

  console.log(`\n⚙️  Starting ${profilesToRun.length} profile(s)...\n`);

  for (let i = 0; i < profilesToRun.length; i++) {
    const profile = profilesToRun[i];
    const profileId = profile.id || profile.profileId;
    let profileResult;

    try {
      console.log(`\n--- Profile ${i + 1}/${profilesToRun.length} ---`);
      profileResult = await startProfile(profileId);
      const status = await navigateAndCheckPage(profileResult.page);
      results.push({
        success: true,
        profileId,
        status,
      });
      console.log(`✅ Profile ${i + 1} completed successfully`);
    } catch (error) {
      console.error(`❌ Profile ${i + 1} failed:`, error.message);
      results.push({
        success: false,
        profileId,
        error: error.message,
      });
    } finally {
      await closeBrowser(profileResult?.browser);
    }
  }

  return results;
}

/**
 * Create a new profile with random fingerprint
 */
async function createNewProfile() {
  try {
    console.log('\n📝 Creating new profile...');

    const profile = await gologin.createProfileRandomFingerprint();
    console.log('✅ Profile response:', JSON.stringify(profile, null, 2));

    const profileId = profile.id;
    console.log(`✅ Profile created with ID: ${profileId}`);

    return profileId;
  } catch (error) {
    console.error('\n❌ Error creating profile');
    console.error('Message:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const providedProfileId = process.argv[2] || process.env.GOLOGIN_PROFILE_ID;

    if (providedProfileId) {
      console.log(`📋 Using specific profile ID: ${providedProfileId}`);
      const profileResult = await startProfile(providedProfileId);

      try {
        const status = await navigateAndCheckPage(profileResult.page);
        console.log('\n✅ Profile execution completed successfully');
        return {
          success: true,
          profileId: providedProfileId,
          status,
        };
      } finally {
        await closeBrowser(profileResult.browser);
      }
    }

    console.log('📋 Fetching all profiles...');
    const profiles = await getProfiles();

    if (profiles.length === 0) {
      console.log('\n⚠️  No profiles found');
      process.exit(1);
    }

    const results = await startProfiles(profiles, config.profileLimit);

    console.log('\n' + '='.repeat(50));
    console.log('📊 EXECUTION SUMMARY');
    console.log('='.repeat(50));
    const successful = results.filter((result) => result.success).length;
    const failed = results.filter((result) => !result.success).length;
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${results.length}`);
    console.log('='.repeat(50));

    return results;
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => {
    console.log('Done!');
  });

export {
  closeBrowser,
  createNewProfile,
  displayProfiles,
  getProfiles,
  navigateAndCheckPage,
  startProfile,
  startProfiles,
};
