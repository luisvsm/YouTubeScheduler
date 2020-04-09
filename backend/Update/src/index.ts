import { APIGatewayEvent } from "aws-lambda";
import AWS from 'aws-sdk'

const s3: AWS.S3 = new AWS.S3({ apiVersion: '2006-03-01' });
let bucket_name: string;
let schedule_file: string;
let update_secret: string;
let cloudflare_bearer: string;
let cloudflare_zone: string;
let cloudfront_dist_id: string;

if (process.env.SCHEDULE_FILE == undefined)
    throw "Missing SCHEDULE_FILE environment variable"
else
    schedule_file = process.env.SCHEDULE_FILE;

if (process.env.BUCKET_NAME == undefined)
    throw "Missing BUCKET_NAME environment variable"
else
    bucket_name = process.env.BUCKET_NAME;

if (process.env.UPDATE_SECRET == undefined)
    throw "Missing UPDATE_SECRET environment variable"
else
    update_secret = process.env.UPDATE_SECRET;

if (process.env.CLOUDFLARE_BEARER == undefined)
    throw "Missing CLOUDFLARE_BEARER environment variable"
else
    cloudflare_bearer = process.env.CLOUDFLARE_BEARER;

if (process.env.CLOUDFLARE_ZONE == undefined)
    throw "Missing CLOUDFLARE_ZONE environment variable"
else
    cloudflare_zone = process.env.CLOUDFLARE_ZONE;

if (process.env.CLOUDFRONT_DIST_ID == undefined)
    throw "Missing CLOUDFRONT_DIST_ID environment variable"
else
    cloudfront_dist_id = process.env.CLOUDFRONT_DIST_ID;

export const handler = async (event: APIGatewayEvent): Promise<any> => {
    console.log('Hello World!', JSON.stringify(event, null, 2));

    if (event.httpMethod == "POST" && event.path == "/get") {
        if (event.body == null) {
            return badSecret();
        } else {
            try {
                body = JSON.parse(event.body);
                if (body.secret !== update_secret) {
                    return badSecret();
                }
            } catch (e) {
                return badSecret();
            }
        }

        console.log("body", body);

        let s3Result: AWS.S3.Types.GetObjectOutput = await getS3({
            Bucket: bucket_name,
            Key: schedule_file
        }).catch((error) => {
            console.log(error);
            return {
                statusCode: 500,
                body: JSON.stringify(error),
                headers: {
                    "Access-Control-Allow-Origin": "https://" + bucket_name,
                }
            };
        }) as AWS.S3.Types.GetObjectOutput;

        if (s3Result.Body == undefined) {
            console.log("s3Result.Body == undefined");
            console.log(s3Result);
            return {
                statusCode: 500,
                body: "",
                headers: {
                    "Access-Control-Allow-Origin": "https://" + bucket_name,
                }
            };
        } else {
            return {
                statusCode: 200,
                body: s3Result.Body.toString(),
                headers: {
                    "Access-Control-Allow-Origin": "https://" + bucket_name,
                }
            };
        }
    } else if (event.httpMethod == "POST" && event.path == "/update") {
        var body;

        if (event.body == null) {
            return badSecret();
        } else {
            try {
                body = JSON.parse(event.body);
                if (body.secret !== update_secret) {
                    return badSecret();
                }
            } catch (e) {
                return badSecret();
            }
        }

        console.log("body", body);

        await putS3({
            Bucket: bucket_name,
            Key: schedule_file,
            Body: body.schedule,
            CacheControl: "max-age=120",
            ContentType: 'application/json; charset=utf-8'
        }).catch((error) => {
            console.log(error);
            return {
                statusCode: 500,
                body: JSON.stringify(error),
                headers: {
                    "Access-Control-Allow-Origin": "https://" + bucket_name,
                }
            };
        });

        await purgeCloudFlareCache();
        await sleep(5000);
        await purgeCloudFrontCache();

        return {
            statusCode: 200,
            body: "",
            headers: {
                "Access-Control-Allow-Origin": "https://" + bucket_name,
            }
        };
    } else {
        return {
            statusCode: 200,
            body: "",
            headers: {
                "Access-Control-Allow-Origin": "https://" + bucket_name,
            }
        };
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getS3(
    request: AWS.S3.Types.GetObjectRequest
): Promise<AWS.S3.Types.GetObjectOutput> {
    return new Promise((resolve, reject) => {
        s3.getObject(request, (error, data) => {
            if (error) {
                return reject(error)
            }

            return resolve(data);
        })
    })
}

async function putS3(
    request: AWS.S3.Types.PutObjectRequest
): Promise<AWS.S3.Types.PutObjectOutput> {
    return new Promise((resolve, reject) => {
        s3.putObject(request, (error, data) => {
            if (error) {
                return reject(error)
            }

            return resolve(data)
        })
    })
}

function badSecret() {
    return {
        statusCode: 400,
        body: "Bad Request",
        headers: {
            "Access-Control-Allow-Origin": "https://" + bucket_name,
        }
    };
}

function purgeCloudFlareCache() {
    return new Promise((resolve, reject) => {
        const https = require('https');
        const postData = JSON.stringify(
            { "files": ["https://" + bucket_name + "/" + schedule_file, { "url": "https://" + bucket_name + "/" + schedule_file, "headers": { "Origin": "https://quarantineshow.com" } }] }
        );

        const options = {
            hostname: 'api.cloudflare.com',
            port: 443,
            path: '/client/v4/zones/' + cloudflare_zone + '/purge_cache',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + cloudflare_bearer,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options);
        req.write(postData);
        req.end();
        req.once('response', (res: any) => {
            if (res.statusCode != 200) {
                console.log(res);
            }
            console.log('CloudFlare statusCode:', res.statusCode);
            resolve();
        });
    });
}

function purgeCloudFrontCache() {
    return new Promise((resolve, reject) => {
        var cloudfront = new AWS.CloudFront();

        var params = {
            DistributionId: cloudfront_dist_id, /* required */
            InvalidationBatch: { /* required */
                CallerReference: Date.now().toString(), /* required */
                Paths: {
                    Quantity: 1,
                    Items: [
                        '/' + schedule_file
                    ]
                }
            }
        };

        cloudfront.createInvalidation(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else console.log(data);           // successful response
            resolve();
        });
    });
}