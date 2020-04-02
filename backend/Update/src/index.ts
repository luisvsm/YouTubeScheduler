import { APIGatewayEvent } from "aws-lambda";
import AWS from 'aws-sdk'


const s3: AWS.S3 = new AWS.S3({ apiVersion: '2006-03-01' });
let bucket_name: string;
let schedule_file: string;
let update_secret: string;

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

export const handler = async (event: APIGatewayEvent): Promise<any> => {
    console.log('Hello World!', JSON.stringify(event, null, 2));

    if (event.httpMethod == "POST" && event.path == "/update") {
        var body;

        if (event.body == null) {
            return badSecret();
        } else {
            try {
                body = JSON.parse(event.body);
            } catch (e) {
                return badSecret();
            }
        }

        console.log("body", body);

        if (body.secret !== update_secret) {
            return badSecret();
        }

        await putS3({
            Bucket: bucket_name,
            Key: schedule_file,
            Body: body.schedule,
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
        body: "Bad Secret",
        headers: {
            "Access-Control-Allow-Origin": "https://" + bucket_name,
        }
    };
}