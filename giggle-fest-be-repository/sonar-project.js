import scanner from "sonarqube-scanner";

scanner(
  {
    serverUrl: process.env.SONAR_HOST_URL || "http://localhost:9000",
    token: process.env.SONAR_TOKEN || "",
    options: {
      "sonar.projectKey": "gigglefest-stqa",
      "sonar.projectName": "Gigglefest STQA",
      "sonar.projectVersion": "1.0.0",
      "sonar.sources": "src",
      "sonar.tests": "src/tests",
      "sonar.test.inclusions": "**/*.test.js,**/*.spec.js",
      "sonar.javascript.lcov.reportPaths": "coverage/lcov.info",
      "sonar.testExecutionReportPaths": "test-report.xml",
      "sonar.coverage.exclusions": [
        "**/*.test.js",
        "**/*.spec.js",
        "**/node_modules/**",
        "**/coverage/**",
        "**/tests/**",
      ].join(","),
      "sonar.cpd.exclusions": ["**/*.test.js", "**/*.spec.js"].join(","),
      "sonar.exclusions": [
        "**/node_modules/**",
        "**/coverage/**",
        "**/dist/**",
      ].join(","),
      "sonar.language": "js",
      "sonar.sourceEncoding": "UTF-8",
    },
  },
  () => {
    console.log("SonarQube analysis completed");
  }
);
