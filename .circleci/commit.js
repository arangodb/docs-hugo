

async function commit_generated() {

    let response = await fetch('https://circleci.com/api/v2/insights/gh/arangodb/docs-hugo/workflows/generate?branch=demo-uc-1.b.i.1', {
        method: 'GET',
        headers: {'content-type': 'application/json', 'Circle-Token': "136e3ef3543343df93136774955b443dd8d77ca8"},
    })
    
    let data = await response.json();

    for (let workflow of data.items) {

        if (workflow.status != "success")
            continue


        let jobs = await fetch('https://circleci.com/api/v2/workflow/'+workflow.id+'/job', {
            method: 'GET',
            headers: {'content-type': 'application/json', 'Circle-Token': "136e3ef3543343df93136774955b443dd8d77ca8"},
        })
        
        let jobsData = await jobs.json();
        for (let job of jobsData.items) {
            if (job.name != "build-with-generated") continue
            console.log(job.job_number)
            let artifacts = await fetch('https://circleci.com/api/v2/project/gh/arangodb/docs-hugo/'+job.job_number+'/artifacts', {
                method: 'GET',
                headers: {'content-type': 'application/json', 'Circle-Token': "136e3ef3543343df93136774955b443dd8d77ca8"},
            })

            let artifactsData = await artifacts.json();
            console.log(artifactsData)
        }
    }
    return data;
}

commit_generated().then(console.log("ok")).catch(console.log("no"))