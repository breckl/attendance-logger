require("dotenv").config();

console.log(process.env.APP_USERNAME)

module.exports = {
  // HUSD ParentVUE Credentials (from environment variables)
  username: process.env.APP_USERNAME,
  password: process.env.APP_PASSWORD,

  // URLs (from environment variables)
  loginUrl: process.env.LOGIN_URL,
  attendanceUrl: process.env.ATTENDANCE_URL,

  // Browser settings
  headless: false, // Set to true for production
  slowMo: 100, // Slow down actions for better reliability

  // Selectors
  selectors: {
    usernameInput: 'input[name="ctl00$MainContent$username"]',
    passwordInput: 'input[type="password"]',
    loginButton: 'input[type="submit"][value="Login"]',
    hoursInputs: 'input[data-bind*="value: hours"]',
    updateAndSubmitButton:
      'button[data-bind*="click: function() { $data.showSubmitModal(true); }"]',
    confirmCheckbox: 'input[data-bind="checked: confirmSubmit"]',
    finalSubmitButton:
      'button[data-bind="enable: confirmSubmit, click: submitTimes"]',
  },
};
