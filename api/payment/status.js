import { StandardCheckoutClient, Env } from 'pg-sdk-node';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { orderId } = req.query;
        if (!orderId) {
            return res.status(400).json({ error: 'Missing orderId' });
        }

        const clientId = (process.env.PHONEPE_CLIENT_ID || '').trim();
        const clientSecret = (process.env.PHONEPE_CLIENT_SECRET || '').trim();
        const clientVersion = parseInt((process.env.PHONEPE_CLIENT_VERSION || '1').trim(), 10);
        const env = (process.env.PHONEPE_ENV || '').trim() === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

        const client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);

        const statusResponse = await client.getOrderStatus(orderId);

        return res.status(200).json(statusResponse);

    } catch (error) {
        console.error("Payment Status Check Error:", error);
        return res.status(500).json({ error: error.message || 'Payment status check failed' });
    }
}
