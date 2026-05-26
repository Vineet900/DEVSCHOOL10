import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const settingsFilePath = path.join(__dirname, '../../config/app_settings.json');

// Ensure config dir exists
const ensureDir = () => {
  const dir = path.dirname(settingsFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const defaultSettings = {
  siteName: 'DevSchool Pro',
  maintenanceMode: false,
  registrationEnabled: true,
  emailNotifications: true,
  supportEmail: 'support@devschool.com',
  aiTutorModel: 'gemini-3.5-flash',
  geminiApiKey: ''
};

const loadSettings = () => {
  ensureDir();
  if (fs.existsSync(settingsFilePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
      return { ...defaultSettings, ...data };
    } catch (_) {}
  }
  
  // Set initial fallback key from env variable
  const initialKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  return { ...defaultSettings, geminiApiKey: initialKey };
};

const updateEnvFile = (key, value) => {
  try {
    const envPath = path.join(__dirname, '../../../.env');
    if (!fs.existsSync(envPath)) return;
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    const regex = new RegExp(`^${key}\\s*=.*$`, 'm');
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
    
    fs.writeFileSync(envPath, envContent, 'utf8');
  } catch (err) {
    console.error('Failed to update .env file:', err);
  }
};

export const getSettings = async (req, res) => {
  try {
    const settings = loadSettings();
    res.json({ success: true, message: "Settings fetched", data: settings });
  } catch (error) {
    res.json({ success: true, data: defaultSettings });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const newSettings = { ...defaultSettings, ...req.body };
    
    // Save to local JSON
    ensureDir();
    fs.writeFileSync(settingsFilePath, JSON.stringify(newSettings, null, 2), 'utf8');

    // Update .env file if key changed
    if (newSettings.geminiApiKey !== undefined) {
      updateEnvFile('GEMINI_API_KEY', newSettings.geminiApiKey);
      process.env.GEMINI_API_KEY = newSettings.geminiApiKey;
    }

    res.json({ success: true, message: "Settings updated successfully", data: newSettings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
