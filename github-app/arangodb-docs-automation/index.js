
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
    context.log("PR BODY")
    //context.log(context.payload.pull_request.body)
    parsePullRequestTemplate(context.payload.pull_request.body);
  }

  function parsePullRequestTemplate(body) {
    lines = body.match(/[^\r\n]+/g);
    lines.forEach((line) => {
      app.log.info("line");
      app.log.info(line)
    });
  }

};
