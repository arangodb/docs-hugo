
const { ProbotOctokit } = require("probot");
var bodyParser = require('body-parser')


// create application/json parser
var jsonParser = bodyParser.json()


// TODO: Important, Place a lock timer on when checkboxes change to not trigger N workflows sequentially on each checkbox change
module.exports = (app, { getRouter }) => {
  const octokit = new ProbotOctokit({
    // any options you'd pass to Octokit
    auth: {
      appId: process.env.APP_ID,
      privateKey: process.env.PRIVATE_KEY,
      installationId: 
    },
    // and a logger
    log: app.log.child({ name: "my-octokit" }),
  });
   // Get an express router to expose new HTTP endpoints
   const router = getRouter("/");

   // Use any middleware
   router.use(require("express").static("public"));
 
   // Add a new route
   router.post("/circleci", jsonParser, (req, res) => {
    console.log("CIRCLECI WEBHOOK")
    console.log(req.body)

    var branch = req.body.pipeline.vcs.branch;

    octokit.rest.checks.listForRef({
      owner: "arangodb",
      repo: "docs-hugo",
      ref: branch
    })
      .then((response) => {
        // console.log(response)
        for (let check_run of response.data.check_runs) {
          console.log(check_run)
        }
      })
     res.send("Hello World");
   });

  
  // app.on(["check_run.completed", "check_run.rerequested"], check);
  app.on(["issue_comment.created"], pullRequestComment);


  async function check(context) {
    const startTime = new Date();
    app.log.info("check invoke")
    // context.log(context.payload)
    // var run_id = context.payload.check_run.id;
    // context.octokit.checks.update(
    //   context.repo({
    //     check_run_id: run_id,
    //     output: {
    //       title: "testtesttest",
    //       summary: "test retest"
    //     }
    //   })
    // )
    // Probot API note: context.repo() => {username: 'hiimbex', repo: 'testing-things'}
    return 
  }



  async function pullRequestComment(context) {
    context.log("Github Webhook: issue_comment.created")
    const comment = context.payload.comment.body;
    context.log("Comment: " + comment)
    if (comment == "/generate") {

      ci_params = {"WORKFLOW": "generate", "GENERATORS": "examples api-docs"}
      prs = []
      const pr_body = context.payload.issue.body;
      context.log("PR Body: " + pr_body)

      const body_lines = pr_body.match(/[^\r\n]+/g);

      for (let line of body_lines) {
        if (line.match(/(?<=- 3.10: *[a-zA-Z\/:.]+)\d+/gm)) { 
          pr_number = line.match(/(?<=- 3.10: *[a-zA-Z\/:.]+)\d+/gm)

          let response = await context.octokit.pulls.get(
            context.repo({
              owner: "arangodb",
              repo: "arangodb",
              pull_number: pr_number
            })
          )

          var branch_name = response.data.head.ref;
          console.log(branch_name)
          ci_params["ARANGODB_BRANCH"] = "stable,"+branch_name+",3.10,"
          continue
        }

        if (line.match(/(?<=- 3.11: *[a-zA-Z\/:.]+)\d+/gm)) { 
          pr_number = line.match(/(?<=- 3.11: *[a-zA-Z\/:.]+)\d+/gm)

          let response = await context.octokit.pulls.get(
            context.repo({
              owner: "arangodb",
              repo: "arangodb",
              pull_number: pr_number
            })
          )

          var branch_name = response.data.head.ref;
          console.log(branch_name)
          ci_params["ARANGODB_BRANCH_2"] = "stable,"+branch_name+",3.11"
          continue
        }
      }

      let response = await context.octokit.pulls.get(
        context.repo({
          owner: "arangodb",
          repo: "docs-hugo",
          pull_number: context.payload.issue.number
        })
      )

      const branch = response.data.head.ref;
      triggerCircleCIPipeline(branch, ci_params)
    }
  }



  async function pullRequestOpen(context) {
    context.log("PR BODY")
    //context.log(context.payload.pull_request.body)

    // var trigger = parsePullRequestTemplate(context.payload.pull_request.body);

    // if (trigger["GENERATORS"] == "") {
    //   trigger["WORKFLOW"] = "plain-build"
    // }


    // let pipeline_id = await triggerCircleCIPipeline(context.payload.pull_request.head.ref, trigger)

    // app.log.info("PIPELINE ID " + pipeline_id)
    // let jobs = await getPipelineJobs(pipeline_id)

    // for (let job of jobs) {
    //   var status = "queued";
    //   if (job.hasOwnProperty("job_number")) status = "in_progress";
    //   context.octokit.checks.create(
    //     context.repo({
    //       name: "custom-check: "+job.name,
    //       head_branch: context.payload.pull_request.head.ref,
    //       head_sha: context.payload.pull_request.head.sha,
    //       status: status,
    //       started_at: new Date(),
    //       output: {
    //         title: "Custom check for " + job.name,
    //         summary: "The check has been created!",
    //       },
    //     })
    //   );
    //   app.log.info("check created")
    // }
    
    // app.log.info("CREATING CHECK")
    
    // var x = context.octokit.checks.create(
    //   context.repo({
    //     name: "My app!",
    //     head_branch: context.payload.pull_request.head.ref,
    //     head_sha: context.payload.pull_request.head.sha,
    //     status: "completed",
    //     started_at: new Date(),
    //     conclusion: "success",
    //     completed_at: new Date(),
    //     output: {
    //       title: "Probot check!",
    //       summary: "The check has passed!",
    //     },
    //   })
    // );
    // app.log.info("X")
    // app.log.info(x)
  }







  function parsePullRequestTemplate(body) {
    var triggerParams = { "WORKFLOW": "plain-build", "GENERATORS": "" }

    const lines = body.match(/[^\r\n]+/g);

    for (let line of lines) {
      const generator = line.match(/(?<=<!-- generate-).*(?=-->)/g);
      if (generator) {
        triggerParams["WORKFLOW"] = "generate"
        const isChecked = line.match(/ *- *\[ *\w *\]/g);
        if (isChecked) {
          triggerParams["GENERATORS"] = triggerParams["GENERATORS"] + generator
        }
      }
    };

    return triggerParams
  }



  async function triggerCircleCIPipeline(branch, params) {
    app.log.info("Trigger CircleCI Pipeline for branch" + branch)
    app.log.info("Trigger Params:")
    app.log.info(params)

    let response = await fetch('https://circleci.com/api/v2/project/gh/arangodb/docs-hugo/pipeline', {
      method: 'POST',
      headers: {'content-type': 'application/json', 'Circle-Token': ""},
      body: JSON.stringify({branch: branch, parameters: params}),
    })
    
    let data = await response.json();
    return data.id;
  }

  async function getPipelineJobs(pipeline_id) {
    res = []
    app.log.info("Get Jobs From " + pipeline_id)

    let workflow = await fetch('https://circleci.com/api/v2/pipeline/'+pipeline_id+'/workflow', {
      method: 'GET',
      headers: {'content-type': 'application/json', 'Circle-Token': ""},
    })
    
    let data = await workflow.json();
    console.log(data)
    workflow_id = data.items[0].id;
    console.log("GET WORKFLOW ID " + workflow_id);

    let jobs = await fetch('https://circleci.com/api/v2/workflow/'+workflow_id+'/job', {
      method: 'GET',
      headers: {'content-type': 'application/json', 'Circle-Token': ""},
    })
    
    let jobsData = await jobs.json();
    for (let job of jobsData.items) {
      console.log(job)
      res.push(job)
    }
    console.log("GET JOBs " + res);
    return res
  }


};
