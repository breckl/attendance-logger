const puppeteer = require("puppeteer");
const config = require("./config");

class AttendanceLogger {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    try {
      console.log("🚀 Starting attendance logger...");

      // Launch browser
      this.browser = await puppeteer.launch({
        headless: config.headless,
        slowMo: config.slowMo,
        defaultViewport: { width: 1280, height: 720 },
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      });

      this.page = await this.browser.newPage();

      // Set user agent to avoid detection
      await this.page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      console.log("✅ Browser initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize browser:", error);
      throw error;
    }
  }

  async login() {
    try {
      console.log("🔐 Logging into ParentVUE...");

      // Navigate to login page
      await this.page.goto(config.loginUrl, { waitUntil: "networkidle2" });

      // Wait for login form to load
      await this.page.waitForSelector(config.selectors.usernameInput, {
        timeout: 10000,
      });

      // Fill in credentials
      await this.page.type(config.selectors.usernameInput, config.username);
      await this.page.type(config.selectors.passwordInput, config.password);

      // Click login button
      await this.page.click(config.selectors.loginButton);

      // Wait for navigation to complete
      await this.page.waitForNavigation({ waitUntil: "networkidle2" });

      console.log("✅ Login successful");
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw error;
    }
  }

  async navigateToAttendance() {
    try {
      console.log("📊 Navigating to attendance page...");

      // Navigate to attendance page
      await this.page.goto(config.attendanceUrl, { waitUntil: "networkidle2" });

      // Wait for page to load
      await this.page.waitForTimeout(2000);

      console.log("✅ Arrived at attendance page");
    } catch (error) {
      console.error("❌ Failed to navigate to attendance page:", error);
      throw error;
    }
  }

  async updateAttendanceHours() {
    try {
      console.log("⏰ Updating attendance hours...");

      // Wait for the hours input fields to be available
      await this.page.waitForSelector(config.selectors.hoursInputs, {
        timeout: 10000,
      });

      // Find all hours input fields
      const hoursInputs = await this.page.$$(config.selectors.hoursInputs);

      if (hoursInputs.length === 0) {
        throw new Error("No hours input fields found");
      }

      console.log(`📝 Found ${hoursInputs.length} hours input fields`);

      // Update each input field to "1"
      for (let i = 0; i < hoursInputs.length; i++) {
        try {
          // Clear the field first
          await hoursInputs[i].click({ clickCount: 3 }); // Triple click to select all
          await hoursInputs[i].type("1");
          console.log(`✅ Updated field ${i + 1} to "1"`);

          // Small delay between updates
          await this.page.waitForTimeout(200);
        } catch (fieldError) {
          console.warn(
            `⚠️ Warning: Could not update field ${i + 1}:`,
            fieldError.message
          );
        }
      }

      console.log("✅ All attendance hours updated successfully");
    } catch (error) {
      console.error("❌ Failed to update attendance hours:", error);
      throw error;
    }
  }

  async clickUpdateButton() {
    try {
      console.log("🔄 Looking for Update Times button...");

      // Try different selectors for the update button
      const updateButtonSelectors = [
        'button:contains("Update Times")',
        'input[value*="Update Times"]',
        'input[type="submit"][value*="Update"]',
        'button[type="submit"]',
        'input[type="button"][value*="Update"]',
      ];

      let updateButton = null;

      for (const selector of updateButtonSelectors) {
        try {
          updateButton = await this.page.$(selector);
          if (updateButton) {
            console.log(`✅ Found update button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!updateButton) {
        // Try to find by text content
        const buttons = await this.page.$$(
          'button, input[type="submit"], input[type="button"]'
        );
        for (const button of buttons) {
          const text = await this.page.evaluate(
            (el) => el.textContent || el.value,
            button
          );
          if (text && text.toLowerCase().includes("update times")) {
            updateButton = button;
            console.log("✅ Found update button by text content");
            break;
          }
        }
      }

      if (!updateButton) {
        throw new Error("Update Times button not found");
      }

      // Click the update button
      await updateButton.click();
      console.log("✅ Update Times button clicked");

      // Wait for any form submission to complete
      await this.page.waitForTimeout(3000);
    } catch (error) {
      console.error("❌ Failed to click Update Times button:", error);
      throw error;
    }
  }

  async run() {
    try {
      await this.init();
      await this.login();
      await this.navigateToAttendance();
      await this.updateAttendanceHours();
      await this.clickUpdateButton();

      console.log("🎉 Attendance logging completed successfully!");

      // Keep browser open for a moment to see the result
      await this.page.waitForTimeout(5000);
    } catch (error) {
      console.error("💥 Attendance logging failed:", error);
    } finally {
      if (this.browser) {
        await this.browser.close();
        console.log("🔒 Browser closed");
      }
    }
  }
}

// Run the attendance logger
if (require.main === module) {
  const logger = new AttendanceLogger();
  logger.run().catch(console.error);
}

module.exports = AttendanceLogger;
