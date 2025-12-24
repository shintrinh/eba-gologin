import { GologinApi } from 'gologin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Token can be passed here in code or from env 
const token = process.env.GL_API_TOKEN;

if (!token || token === 'your_dev_token_here') {
  console.error('❌ Error: GL_API_TOKEN not set or is placeholder value');
  console.error('Please set your API token: set GL_API_TOKEN=your_token_here');
  process.exit(1);
}

const gologin = GologinApi({
  token,
});

/**
 * Get list of all profiles from workspace using REST API
 * API Reference: https://gologin.com/docs/api-reference/workspace/get-all-profiles-in-workspace
 * 
 * REST API Example:
 * fetch('https://api.gologin.com/browser/v2?page=1&sorterField=createdAt&sorterOrder=descend', {
 *   method: 'GET',
 *   headers: {Authorization: 'Bearer <token>'}
 * })
 */
async function getProfiles() {
  try {
    console.log('\n📋 Fetching profiles list from API...');
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await fetch(
      'https://api.gologin.com/browser/v2?page=1&sorterField=createdAt&sorterOrder=descend',
      options
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

    // Opens new page in browser
    const page = await browser.newPage();
    console.log('✅ New page created');

    // Goes to website and waits untill all parts of the website is loaded
    console.log('Navigating to whoer.net...');
    await page.goto('https://whoer.net/', { waitUntil: 'networkidle2' });
    console.log('✅ Page loaded');

    // Reads profile check result in website
    const status = await page.$eval('.trustworthy:not(.hide)',
      (elt) => elt?.innerText?.trim(),
    );

    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('✅ Status found:', status);

    return { success: true, profileId, status };
  } catch (error) {
    console.error('\n❌ Error occurred while running profile');
    
    // Better error logging
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
    
    try {
      console.log(`\n--- Profile ${i + 1}/${profilesToRun.length} ---`);
      const result = await startProfile(profileId);
      results.push(result);
      console.log(`✅ Profile ${i + 1} completed successfully`);
    } catch (error) {
      console.error(`❌ Profile ${i + 1} failed:`, error.message);
      results.push({ 
        success: false, 
        profileId, 
        error: error.message 
      });
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
    // Get profile ID from command line argument or environment variable
    const providedProfileId = process.argv[2] || process.env.GOLOGIN_PROFILE_ID;
    
    if (providedProfileId) {
      // If specific profile ID is provided, start only that profile
      console.log(`📋 Using specific profile ID: ${providedProfileId}`);
      const result = await startProfile(providedProfileId);
      console.log('\n✅ Profile execution completed successfully');
      return result;
    }
    
    // Otherwise, fetch all profiles and start them
    console.log('📋 Fetching all profiles...');
    const profiles = await getProfiles();
    
    if (profiles.length === 0) {
      console.log('\n⚠️  No profiles found');
      console.log('Create a profile at: https://app.gologin.com/personalArea/Profiles');
      process.exit(1);
    }
    
    // For testing: start only 1 profile (change limit to run more)
    const PROFILE_LIMIT = 1; // Change to 0 to run all profiles
    const results = await startProfiles(profiles, PROFILE_LIMIT);
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 EXECUTION SUMMARY');
    console.log('='.repeat(50));
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
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

main().catch(console.error)
  .finally(() => {
    console.log('Done!');
    //gologin.exit();
  });
