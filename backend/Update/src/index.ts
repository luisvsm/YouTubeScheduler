import { APIGatewayEvent } from "aws-lambda";

export const handler = async (event: APIGatewayEvent): Promise<any> => {
    console.log('Hello World!', JSON.stringify(event, null, 2));

    return { statusCode: 200, body: "hello" };
}