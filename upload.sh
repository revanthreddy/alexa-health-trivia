#!/usr/bin/env bash

file="lambda.zip"
function_name="alexa_simple"

# if [ -f $file ] ; then
#     rm $file
# fi

zip -r $file *

aws lambda update-function-code --function-name $function_name --zip-file fileb://$file --profile revanth.reddy
rm $file


