// Checks API example
// See: https://developer.github.com/v3/checks/ to learn more

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
module.exports = (app) => {
  app.log.info("srtart")
  app.on(["check_suite.requested", "check_run.rerequested", "check_run.completed"], check);
  app.on(["pull_request.opened", "pull_request.synchronize"], pullRequestOpen);

  async function check(context) {
    const startTime = new Date();
    app.log.info("check invoke")
    context.log(context.payload)
    
  }

  async function pullRequestOpen(context) {
    context.log(context.payload);
    context.log("PR BODY")
    context.log(context.payload.body)
  }

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
