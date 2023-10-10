
const { exit } = require("process");
const args = process.argv.slice(2);

async function commit_generated() {

    let response = await fetch('https://circleci.com/api/v2/insights/gh/arangodb/docs-hugo/workflows/generate?branch='+args[0], {
        method: 'GET',
        headers: {'content-type': 'application/json', 'Circle-Token': process.env.CIRCLECI_API_TOKEN},
    })
    
    let data = await response.json();

    for (let workflow of data.items) {

        if (workflow.status != "success")
            continue


        let jobs = await fetch('https://circleci.com/api/v2/workflow/'+workflow.id+'/job', {
            method: 'GET',
            headers: {'content-type': 'application/json', 'Circle-Token': process.env.CIRCLECI_API_TOKEN},
        })
        
        let jobsData = await jobs.json();
        for (let job of jobsData.items) {
            if (job.name != "generate") continue
            let artifacts = await fetch('https://circleci.com/api/v2/project/gh/arangodb/docs-hugo/'+job.job_number+'/artifacts', {
                method: 'GET',
                headers: {'content-type': 'application/json', 'Circle-Token': process.env.CIRCLECI_API_TOKEN},
            })

            let artifactsData = await artifacts.json();
            if (artifactsData.items.length == 0) continue
            console.log(job.id)
            exit()
        }
    }
}

commit_generated().then().catch()