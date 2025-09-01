#!/usr/bin/env node

const EnhancedAttendanceLogger = require("./attendance-logger");

console.log("🎓 HUSD Attendance Logger");
console.log("========================\n");

async function main() {
  try {
    const logger = new EnhancedAttendanceLogger();

    console.log("Starting automated attendance logging...\n");

    await logger.run();

    console.log("\n🎉 Process completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n💥 Process failed with error:", error.message);
    console.error("\nTroubleshooting tips:");
    console.error("1. Check your internet connection");
    console.error("2. Verify your credentials in config.js");
    console.error('3. Run "npm run test" to debug selectors');
    console.error("4. Check if the website structure has changed");

    process.exit(1);
  }
}

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.log("\n\n⚠️ Process interrupted by user");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n⚠️ Process terminated");
  process.exit(0);
});

// Run the main function
main();
