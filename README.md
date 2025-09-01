# Attendance Logger

An automated Node.js application that logs attendance on the HUSD ParentVUE website using Puppeteer.

## Features

- 🔐 Automated login to ParentVUE
- 📊 Navigation to attendance page
- ⏰ Automatic filling of 10 attendance hours with "1"
- 🔄 Clicks "Update Times" button
- 🚀 Configurable browser settings
- 📝 Detailed logging and error handling

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

## Installation

1. Clone or download this repository
2. Navigate to the project directory:

   ```bash
   cd attendance-logger
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

### Environment Variables Setup

The app uses environment variables for sensitive information like credentials and URLs. Follow these steps to set up your `.env` file:

1. **Create a `.env` file** in the project root directory:

   ```bash
   touch .env
   ```

2. **Add your credentials and URLs** to the `.env` file:

   ```env
   # HUSD ParentVUE Credentials
   USERNAME=your_username_here
   PASSWORD=your_password_here

   # URLs
   LOGIN_URL=https://parentvue.husd.org/PXP2_Login_Parent.aspx
   ATTENDANCE_URL=https://parentvue.husd.org/PXP2_Attendance.aspx?AGU=2&VDT=1
   ```

3. **Replace the placeholder values** with your actual ParentVUE credentials and URLs

4. **Important**: The `.env` file is already included in `.gitignore`, so your credentials will not be committed to version control

### Other Configuration

Additional settings can be modified in `config.js`:

- **Browser settings**: Headless mode, delays, etc.
- **Selectors**: CSS selectors for form elements

## Usage

### Basic Usage

Run the attendance logger:

```bash
npm start
```

### Development Mode

Run with auto-restart on file changes:

```bash
npm run dev
```

### Programmatic Usage

```javascript
const AttendanceLogger = require("./index");

const logger = new AttendanceLogger();
logger.run().catch(console.error);
```

## How It Works

1. **Browser Initialization**: Launches a Chrome browser instance
2. **Login**: Navigates to ParentVUE login page and authenticates
3. **Navigation**: Goes to the attendance page
4. **Data Entry**: Finds all 10 hours input fields and sets them to "1"
5. **Submission**: Clicks the "Update Times" button
6. **Cleanup**: Closes the browser

## Troubleshooting

### Common Issues

1. **Login Failed**: Check credentials in your `.env` file
2. **Environment Variables Not Loading**: Ensure your `.env` file is in the project root and has the correct format
3. **Elements Not Found**: The website structure may have changed - update selectors in `config.js`
4. **Browser Crashes**: Try setting `headless: true` in config
5. **Slow Performance**: Adjust `slowMo` value in config

### Debug Mode

Set `headless: false` in `config.js` to see the browser in action and debug issues.

### Selector Updates

If the website changes, you may need to update the selectors in `config.js`:

```javascript
selectors: {
  usernameInput: 'input[name="ctl00$MainContent$txtUserName"]',
  passwordInput: 'input[name="ctl00$MainContent$txtPassword"]',
  // ... other selectors
}
```

## Security Notes

- ⚠️ **Never commit credentials to version control** - The `.env` file is already in `.gitignore`
- 🔒 **Use environment variables** - Credentials are stored in `.env` file, not in code
- 🚫 This tool is for educational/authorized use only
- 🔐 **Keep your `.env` file secure** - Don't share it with others

## Dependencies

- **Puppeteer**: Browser automation
- **dotenv**: Environment variable management (required for `.env` file support)

## License

MIT License - see LICENSE file for details

## Support

If you encounter issues:

1. Check the console output for error messages
2. Verify the website structure hasn't changed
3. Update selectors if necessary
4. Ensure your credentials are correct

## Disclaimer

This tool is designed for educational purposes and authorized automation. Please ensure you have permission to use automated tools on the target website and comply with their terms of service.
