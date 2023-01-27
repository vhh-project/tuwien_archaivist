#!/bin/bash

index_location=${1:-index_backup/index.json} 
docker-compose cp $index_location baseline:/baseline/index.json
docker-compose exec baseline /opt/vespa/bin/vespa-feed-client --endpoint http://localhost:8080 --file /baseline/index.json --show-errors
