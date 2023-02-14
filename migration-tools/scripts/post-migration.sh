#!/bin/bash

echo "----- RESTRUCTURING SECTIONS"

echo "----- VERSION " "$1"
echo "----- MOVING FOLDERS"
cd "$1"/site/content/"$2"
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
echo "----- DONE"

echo "----- UPDATING SECTIONS NAVIGATION"
touch introduction/_index.md deploying/_index.md operations/_index.md developer/_index.md _index.md

echo "---
title: '"$1"'
weight: 0
description: 
layout: default
---" >> _index.md
echo "---
title: Introduction to ArangoDB
weight: 1000
description: 
layout: default
---" >> introduction/_index.md
echo "---
title: Deploying to ArangoDB
weight: 8000
description: 
layout: default
---" >> deploying/_index.md
echo "---
title: Operations
weight: 9000
description: 
layout: default
---" >> operations/_index.md
echo "---
title: Developer topics
weight: 10000
description: 
layout: default
---" >> developer/_index.md

sed -i "s/weight: .*/weight: 2000/" arangograph/_index.md
sed -i "s/weight: .*/weight: 3000/" aql/_index.md
sed -i "s/title: .*/title: ArangoDB Query Language (AQL)/" aql/_index.md
sed -i "s/weight: .*/weight: 4000/" graphs/_index.md
sed -i "s/weight: .*/weight: 5000/" data-science/_index.md
sed -i "s/weight: .*/weight: 6000/" transactions/_index.md
sed -i "s/weight: .*/weight: 7000/" indexing/_index.md
sed -i "s/title: .*/title: Indexing and Searching Data/" indexing/_index.md
echo "---- DONE"

echo "---- EXECUTING POST MIGRAITON PYTHON SCRIPT 3.10"
cd "$1"/migration-tools/scripts
python3 post_migration.py --dst "$1" --version "$2"

echo "---- DONE"