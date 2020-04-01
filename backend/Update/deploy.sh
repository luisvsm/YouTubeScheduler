# Set up vars
zipName=deploy_`date +%s`.zip
version="0.1.0"

# clean distribution folder
rm ./dist/*

# Build Lambda dist folder
npm install
tsc

# Build zip file
cd dist/
zip -r -X ${zipName} .
cd ../

# Upload to S3
aws s3 cp ./dist/${zipName} s3://youtube.scheduler.deploy/v${version}/${zipName}

terraform apply -var="app_zip=${zipName}" -var="app_version=${version}"