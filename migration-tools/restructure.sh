#!/bin/bash

cd ../site/content/3.10
mkdir -p introduction deploying operations developer
mv about-arangodb introduction
mv getting-started introduction
mv modeling-data introduction
mv programs-tools introduction

mv analyzers indexing

mv architecture deploying
mv deployment deploying
mv satellites/_index.md deploying/deployment/satellites.md
mv smartjoins/_index.md deploying/deployment/smartjoins.md
mv arangosync deploying/deployment

mv installation operations
mv uninstallation/_index.md operations/uninstallation.md
mv backup-restore/_index.md operations/backup-restore.md
mv upgrading operations
mv downgrading/_index.md operations/downgrading.md
mv administration operations
mv security operations
mv monitoring operations
mv troubleshooting operations

mv http developer
mv drivers developer
mv foxx-microservices developer

touch introduction/_index.md deploying/_index.md operations/_index.md developer/_index.md _index.md

echo "---
fileID: transactions
title: '3.10'
weight: 0
description: 
layout: default
---" >> _index.md
echo "---
fileID: transactions
title: Operations
weight: 9000
description: 
layout: default
---" >> operations/_index.md
echo "---
fileID: transactions
title: Developer topics
weight: 10000
description: 
layout: default
---" >> developer/_index.md
echo "---
fileID: transactions
title: Introduction to ArangoDB
weight: 1000
description: 
layout: default
---" >> introduction/_index.md
echo "---
fileID: transactions
title: Operations
weight: 9000
description: 
layout: default
---" >> operations/_index.md
echo "---
fileID: transactions
title: Developer topics
weight: 10000
description: 
layout: default
---" >> developer/_index.md



cd ../3.11
mkdir -p introduction deploying operations developer
mv about-arangodb introduction
mv getting-started introduction
mv modeling-data introduction
mv programs-tools introduction

mv analyzers indexing

mv architecture deploying
mv deployment deploying
mv satellites/_index.md deploying/deployment/satellites.md
mv smartjoins/_index.md deploying/deployment/smartjoins.md
mv arangosync deploying/deployment

mv installation operations
mv uninstallation/_index.md operations/uninstallation.md
mv backup-restore/_index.md operations/backup-restore.md
mv upgrading operations
mv downgrading/_index.md operations/downgrading.md
mv administration operations
mv security operations
mv monitoring operations
mv troubleshooting operations

mv http developer
mv drivers developer
mv foxx-microservices developer

touch introduction/_index.md deploying/_index.md operations/_index.md developer/_index.md _index.md

echo "---
fileID: transactions
title: '3.11'
weight: 0
description: 
layout: default
---" >> _index.md
echo "---
fileID: transactions
title: Introduction to ArangoDB
weight: 1000
description: 
layout: default
---" >> introduction/_index.md
echo "---
fileID: transactions
title: Operations
weight: 9000
description: 
layout: default
---" >> operations/_index.md
echo "---
fileID: transactions
title: Developer topics
weight: 10000
description: 
layout: default
---" >> developer/_index.md
