const puppeteer = require("puppeteer");
const config = require("./config");

async function testSelectors() {
  let browser = null;
  let page = null;

  try {
    console.log("🧪 Testing selectors and website structure...");

    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 500,
      defaultViewport: { width: 1366, height: 768 },
    });

    page = await browser.newPage();

    // Set user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Test login page
    console.log("\n🔐 Testing login page...");
    await page.goto(config.loginUrl, { waitUntil: "networkidle2" });

    // Check for username field
    const usernameField = await page.$(config.selectors.usernameInput);
    if (usernameField) {
      console.log("✅ Username field found");
    } else {
      console.log("❌ Username field not found");
      // Try to find any username-like field
      const possibleUsernameFields = await page.$$(
        'input[type="text"], input[name*="user"], input[name*="login"]'
      );
      console.log(
        `Found ${possibleUsernameFields.length} possible username fields`
      );
      for (let i = 0; i < possibleUsernameFields.length; i++) {
        const name = await page.evaluate(
          (el) => el.name,
          possibleUsernameFields[i]
        );
        const id = await page.evaluate(
          (el) => el.id,
          possibleUsernameFields[i]
        );
        console.log(`  Field ${i + 1}: name="${name}", id="${id}"`);
      }
    }

    // Check for password field
    const passwordField = await page.$(config.selectors.passwordInput);
    if (passwordField) {
      console.log("✅ Password field found");
    } else {
      console.log("❌ Password field not found");
      // Try to find any password-like field
      const possiblePasswordFields = await page.$$('input[type="password"]');
      console.log(
        `Found ${possiblePasswordFields.length} possible password fields`
      );
      for (let i = 0; i < possiblePasswordFields.length; i++) {
        const name = await page.evaluate(
          (el) => el.name,
          possiblePasswordFields[i]
        );
        const id = await page.evaluate(
          (el) => el.id,
          possiblePasswordFields[i]
        );
        console.log(`  Field ${i + 1}: name="${name}", id="${id}"`);
      }
    }

    // Check for login button
    const loginButton = await page.$(config.selectors.loginButton);
    if (loginButton) {
      console.log("✅ Login button found");
    } else {
      console.log("❌ Login button not found");
      // Try to find any submit-like button
      const possibleSubmitButtons = await page.$$(
        'input[type="submit"], button[type="submit"], button'
      );
      console.log(
        `Found ${possibleSubmitButtons.length} possible submit buttons`
      );
      for (let i = 0; i < possibleSubmitButtons.length; i++) {
        const value = await page.evaluate(
          (el) => el.value,
          possibleSubmitButtons[i]
        );
        const text = await page.evaluate(
          (el) => el.textContent,
          possibleSubmitButtons[i]
        );
        const type = await page.evaluate(
          (el) => el.type,
          possibleSubmitButtons[i]
        );
        console.log(
          `  Button ${i + 1}: type="${type}", value="${value}", text="${text}"`
        );
      }
    }

    // Now try to login
    console.log("\n🔐 Attempting login...");
    if (usernameField && passwordField && loginButton) {
      await page.type(config.selectors.usernameInput, config.username);
      await page.type(config.selectors.passwordInput, config.password);
      await page.click(config.selectors.loginButton);

      // Wait for navigation
      try {
        await page.waitForNavigation({
          waitUntil: "networkidle2",
          timeout: 10000,
        });
        console.log("✅ Login appears successful");

        // Test attendance page
        console.log("\n📊 Testing attendance page...");
        await page.goto(config.attendanceUrl, { waitUntil: "networkidle2" });
        await page.waitForTimeout(3000);

        // Check for hours input fields
        const hoursInputs = await page.$$(config.selectors.hoursInputs);
        console.log(`Found ${hoursInputs.length} hours input fields`);

        if (hoursInputs.length === 0) {
          console.log("❌ No hours input fields found with current selector");
          // Try alternative selectors
          const alternativeSelectors = [
            'input[data-bind*="hours"]',
            'input[data-bind*="Hours"]',
            'input[maxlength="2"]',
            'input[type="text"]',
          ];

          for (const selector of alternativeSelectors) {
            const fields = await page.$$(selector);
            if (fields.length > 0) {
              console.log(
                `✅ Found ${fields.length} fields with selector: ${selector}`
              );
              break;
            }
          }
        } else {
          // Test updating a field
          console.log("✅ Testing field update...");
          await hoursInputs[0].click({ clickCount: 3 });
          await page.keyboard.press("Backspace");
          await hoursInputs[0].type("1");

          const value = await page.evaluate((el) => el.value, hoursInputs[0]);
          console.log(`Field value after update: "${value}"`);
        }

        // Look for update button
        console.log("\n🔄 Looking for update button...");
        const updateButton = await page.$('button:contains("Update Times")');
        if (updateButton) {
          console.log("✅ Update Times button found");
        } else {
          console.log("❌ Update Times button not found");
          // Look for any button with update-like text
          const allButtons = await page.$$(
            'button, input[type="submit"], input[type="button"]'
          );
          console.log(`Found ${allButtons.length} total buttons/inputs`);

          for (let i = 0; i < allButtons.length; i++) {
            const value = await page.evaluate((el) => el.value, allButtons[i]);
            const text = await page.evaluate(
              (el) => el.textContent,
              allButtons[i]
            );
            const type = await page.evaluate((el) => el.type, allButtons[i]);
            console.log(
              `  Button ${
                i + 1
              }: type="${type}", value="${value}", text="${text}"`
            );
          }
        }
      } catch (navError) {
        console.log("❌ Login may have failed or timed out:", navError.message);
      }
    }

    console.log("\n🧪 Selector testing completed");
  } catch (error) {
    console.error("💥 Selector testing failed:", error);
  } finally {
    if (browser) {
      console.log("\nPress any key to close browser...");
      await new Promise((resolve) => {
        process.stdin.once("data", resolve);
      });
      await browser.close();
    }
  }
}

// Run the test
testSelectors().catch(console.error);
