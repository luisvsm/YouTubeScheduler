import { APIGatewayEvent } from "aws-lambda";
import AWS from 'aws-sdk'


const s3: AWS.S3 = new AWS.S3({ apiVersion: '2006-03-01' });
let bucket_name: string;
let schedule_file: string;

if (process.env.SCHEDULE_FILE == undefined)
    throw "Missing SCHEDULE_FILE environment variable"
else
    schedule_file = process.env.SCHEDULE_FILE;

if (process.env.BUCKET_NAME == undefined)
    throw "Missing BUCKET_NAME environment variable"
else
    bucket_name = process.env.BUCKET_NAME;

export const handler = async (event: APIGatewayEvent): Promise<any> => {
    console.log('Hello World!', JSON.stringify(event, null, 2));

    async function put(
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

    await put({
        Bucket: bucket_name,
        Key: schedule_file,
        Body: '{"hello":"world"}',
        ContentType: 'application/json; charset=utf-8'
    });

    return { statusCode: 200, body: "hello" };
}