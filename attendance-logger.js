const puppeteer = require("puppeteer");
const config = require("./config");

class EnhancedAttendanceLogger {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
  }

  async init() {
    try {
      console.log("🚀 Starting enhanced attendance logger...");

      // Launch browser with enhanced options
      this.browser = await puppeteer.launch({
        headless: config.headless,
        slowMo: config.slowMo,
        defaultViewport: { width: 1366, height: 768 },
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
        ],
      });

      this.page = await this.browser.newPage();

      // Enhanced user agent
      await this.page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Set extra headers
      await this.page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      });

      console.log("✅ Browser initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize browser:", error);
      throw error;
    }
  }

  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.warn(`⚠️ Element not found: ${selector}`);
      return false;
    }
  }

  async findElementByText(text, elementType = "button") {
    try {
      const elements = await this.page.$$(elementType);
      for (const element of elements) {
        const elementText = await this.page.evaluate((el) => {
          return el.textContent || el.value || el.innerText || "";
        }, element);

        if (elementText.toLowerCase().includes(text.toLowerCase())) {
          return element;
        }
      }
      return null;
    } catch (error) {
      console.warn(
        `⚠️ Error finding element by text "${text}":`,
        error.message
      );
      return null;
    }
  }

  async login() {
    try {
      console.log("🔐 Logging into ParentVUE...");

      // Navigate to login page
      await this.page.goto(config.loginUrl, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait for login form to load
      const usernameFound = await this.waitForElement(
        config.selectors.usernameInput
      );
      if (!usernameFound) {
        throw new Error("Username input field not found");
      }

      // Clear and fill username
      await this.page.click(config.selectors.usernameInput, { clickCount: 3 });
      await this.page.type(config.selectors.usernameInput, config.username);

      // Clear and fill password
      await this.page.click(config.selectors.passwordInput, { clickCount: 3 });
      await this.page.type(config.selectors.passwordInput, config.password);

      // Click login button
      await this.page.click(config.selectors.loginButton);

      // Wait for navigation to complete
      await this.page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Check if login was successful
      const currentUrl = this.page.url();
      if (currentUrl.includes("Login") || currentUrl.includes("login")) {
        throw new Error("Still on login page - login may have failed");
      }

      this.isLoggedIn = true;
      console.log("✅ Login successful");
      
      // Wait a bit longer after login to ensure session is fully established
      console.log("⏳ Waiting for session to stabilize...");
      await this.page.waitForTimeout(5000);
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw error;
    }
  }

  async navigateToAttendance(retries = 2) {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        console.log(`📊 Navigating to attendance page (attempt ${attempt}/${retries + 1})...`);

        // Navigate to attendance page
        const response = await this.page.goto(config.attendanceUrl, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });

        // Check for 500 error
        if (response && response.status() === 500) {
          console.error("❌ Server returned 500 error - Internal Server Error");
          console.error("💡 This might be caused by an incorrect ATTENDANCE_URL in your .env file");
          console.error(`   Current URL: ${config.attendanceUrl}`);
          console.error("   Please verify the URL matches your ParentVUE attendance page");
          if (attempt <= retries) {
            console.log(`💡 Retrying in 10 seconds... (${retries - attempt + 1} retries left)`);
            await this.page.waitForTimeout(10000);
            continue;
          } else {
            throw new Error(`Server returned 500 error after ${retries + 1} attempts. Please check your ATTENDANCE_URL in .env file (ID: FADCD)`);
          }
        }

        // Wait for page to load and check if we're still logged in
        await this.page.waitForTimeout(3000);

        // Check if we got redirected to login page due to expired session
        const currentUrl = this.page.url();
        if (currentUrl.includes("Login") || currentUrl.includes("login")) {
          throw new Error("Redirected to login page - session may have expired");
        }

        // Verify we're on the attendance page
        const pageTitle = await this.page.title();
        const pageUrl = this.page.url();

        if (
          !pageUrl.includes("Attendance") &&
          !pageTitle.toLowerCase().includes("attendance")
        ) {
          throw new Error("Failed to reach attendance page");
        }

        console.log("✅ Arrived at attendance page");
        return; // Success, exit the retry loop
      } catch (error) {
        if (attempt <= retries && error.message.includes("500 error")) {
          console.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);
          continue;
        } else {
          console.error("❌ Failed to navigate to attendance page:", error);
          throw error;
        }
      }
    }
  }

  async updateAttendanceHours() {
    try {
      console.log("⏰ Updating attendance hours...");

      // Wait for the hours input fields to be available
      const hoursFound = await this.waitForElement(
        config.selectors.hoursInputs,
        15000
      );
      if (!hoursFound) {
        throw new Error("Hours input fields not found");
      }

      // Find all hours input fields
      const hoursInputs = await this.page.$$(config.selectors.hoursInputs);

      if (hoursInputs.length === 0) {
        throw new Error("No hours input fields found");
      }

      console.log(`📝 Found ${hoursInputs.length} hours input fields`);

      // Update each input field to "1"
      let updatedCount = 0;
      for (let i = 0; i < hoursInputs.length; i++) {
        try {
          // Check if field is disabled
          const isDisabled = await this.page.evaluate(
            (el) => el.disabled,
            hoursInputs[i]
          );
          if (isDisabled) {
            console.log(`⏭️ Field ${i + 1} is disabled, skipping...`);
            continue;
          }

          // Clear the field first
          await hoursInputs[i].click({ clickCount: 3 });
          await this.page.keyboard.press("Backspace");

          // Type "1"
          await hoursInputs[i].type("1");

          // Verify the value was set
          const value = await this.page.evaluate(
            (el) => el.value,
            hoursInputs[i]
          );
          if (value === "1") {
            console.log(`✅ Updated field ${i + 1} to "1"`);
            updatedCount++;
          } else {
            console.warn(
              `⚠️ Field ${
                i + 1
              } value verification failed: expected "1", got "${value}"`
            );
          }

          // Small delay between updates
          await this.page.waitForTimeout(300);
        } catch (fieldError) {
          console.warn(
            `⚠️ Warning: Could not update field ${i + 1}:`,
            fieldError.message
          );
        }
      }

      console.log(
        `✅ Successfully updated ${updatedCount} out of ${hoursInputs.length} fields`
      );

      if (updatedCount === 0) {
        throw new Error("No fields were successfully updated");
      }
    } catch (error) {
      console.error("❌ Failed to update attendance hours:", error);
      throw error;
    }
  }

  async clickUpdateButton() {
    try {
      console.log("🔄 Looking for Update and Submit button...");

      // Find the Update and Submit button
      const updateAndSubmitButton = await this.page.$(
        config.selectors.updateAndSubmitButton
      );
      if (!updateAndSubmitButton) {
        throw new Error("Update and Submit button not found");
      }

      // Click the Update and Submit button to open the modal
      await updateAndSubmitButton.click();
      console.log("✅ Update and Submit button clicked, waiting for modal...");

      // Wait for the modal to appear and the checkbox to be available
      await this.page.waitForSelector(config.selectors.confirmCheckbox, {
        timeout: 10000,
      });
      console.log("✅ Modal appeared, checkbox found");

      // Check the confirmation checkbox
      const confirmCheckbox = await this.page.$(
        config.selectors.confirmCheckbox
      );
      await confirmCheckbox.click();
      console.log("✅ Confirmation checkbox checked");

      // Wait a moment for the checkbox state to update
      await this.page.waitForTimeout(1000);

      // Find and click the final submit button
      const finalSubmitButton = await this.page.$(
        config.selectors.finalSubmitButton
      );
      if (!finalSubmitButton) {
        throw new Error("Final submit button not found");
      }

      // Click the final submit button
      await finalSubmitButton.click();
      console.log("✅ Final submit button clicked");

      // Wait for submission to complete
      await this.page.waitForTimeout(5000);

      // Check for success message or redirect
      const pageContent = await this.page.content();
      if (
        pageContent.includes("success") ||
        pageContent.includes("submitted") ||
        pageContent.includes("saved")
      ) {
        console.log("✅ Submission appears to be successful");
      } else {
        console.log("ℹ️ Submission completed (no success message detected)");
      }
    } catch (error) {
      console.error("❌ Failed to complete submission process:", error);
      throw error;
    }
  }

  async takeScreenshot(filename = "attendance-result.png") {
    try {
      await this.page.screenshot({
        path: filename,
        fullPage: true,
      });
      console.log(`📸 Screenshot saved as ${filename}`);
    } catch (error) {
      console.warn("⚠️ Failed to take screenshot:", error.message);
    }
  }

  async run() {
    try {
      await this.init();
      await this.login();
      await this.navigateToAttendance();
      await this.updateAttendanceHours();
      await this.clickUpdateButton();

      // Take a screenshot of the result
      await this.takeScreenshot();

      console.log("🎉 Attendance logging completed successfully!");

      // Keep browser open for a moment to see the result
      await this.page.waitForTimeout(5000);
    } catch (error) {
      console.error("💥 Attendance logging failed:", error);

      // Take error screenshot
      try {
        await this.takeScreenshot("error-screenshot.png");
      } catch (screenshotError) {
        console.warn(
          "⚠️ Failed to take error screenshot:",
          screenshotError.message
        );
      }

      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
        console.log("🔒 Browser closed");
      }
    }
  }
}

// Run the enhanced attendance logger
if (require.main === module) {
  const logger = new EnhancedAttendanceLogger();
  logger.run().catch(console.error);
}

module.exports = EnhancedAttendanceLogger;
