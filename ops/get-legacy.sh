#!/bin/bash

curl https://daostack-alchemy.herokuapp.com/api/proposals \
  | jq 'map({(.descriptionHash):{url:.description,title:.title,submittedAt:.submittedAt,daoAvatarAddress:.daoAvatarAddress}})|add' \
  > legacy.json
