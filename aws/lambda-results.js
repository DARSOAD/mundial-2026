import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";

const s3 = new S3Client({});
const cf = new CloudFrontClient({});

export const handler = async (event) => {
  const { BUCKET_NAME, CLOUDFRONT_DISTRIBUTION_ID } = process.env;
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { action, userId, results } = body;

    if (action !== "saveResults") {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };
    }

    if (userId !== "diego") {
      return { statusCode: 403, headers, body: JSON.stringify({ error: "No autorizado" }) };
    }

    if (!results || typeof results !== "object") {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing results" }) };
    }

    let existing = {};
    try {
      const getRes = await s3.send(new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: "mundial-2026/resultados.json"
      }));
      const text = await getRes.Body.transformToString();
      existing = JSON.parse(text);
    } catch (e) {
      // File doesn't exist yet, start fresh
    }

    const merged = { ...existing, ...results };

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: "mundial-2026/resultados.json",
      Body: JSON.stringify(merged),
      ContentType: "application/json",
      CacheControl: "no-cache, no-store, must-revalidate"
    }));

    if (CLOUDFRONT_DISTRIBUTION_ID) {
      await cf.send(new CreateInvalidationCommand({
        DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: Date.now().toString(),
          Paths: { Quantity: 1, Items: ["/mundial-2026/resultados.json"] }
        }
      }));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, results: merged })
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
