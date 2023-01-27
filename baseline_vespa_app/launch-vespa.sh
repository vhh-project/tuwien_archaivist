#!/bin/bash

# wait for config server to launch and launch content server in the background
/baseline/wait-for-config-server.sh &

# actively running command
/usr/local/bin/start-container.sh

