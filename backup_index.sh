#!/bin/bash

mkdir index_backup
docker-compose exec baseline /opt/vespa/bin/vespa-visit --fieldset 'baseline:[document]' > index_backup/index.json
