import { StandardCheckoutClient, Env, CreateSdkOrderRequest } from 'pg-sdk-node';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { merchantOrderId, amount, redirectUrl, message } = req.body;

        const clientId = (process.env.PHONEPE_CLIENT_ID || '').trim();
        const clientSecret = (process.env.PHONEPE_CLIENT_SECRET || '').trim();
        const clientVersion = parseInt((process.env.PHONEPE_CLIENT_VERSION || '1').trim(), 10);
        const env = (process.env.PHONEPE_ENV || '').trim() === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

        const client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);

        const request = CreateSdkOrderRequest.StandardCheckoutBuilder()
            .merchantOrderId(merchantOrderId)
            .amount(amount)
            .redirectUrl(redirectUrl)
            .message(message || "Payment for Bethany Homestay")
            .build();

        console.log('PhonePe SDK Request:', { merchantOrderId, amount, amountInRupees: amount / 100, message });

        const response = await client.pay(request);

        return res.status(200).json(response);

    } catch (error) {
        console.error("Payment Initiation Error:", error);
        return res.status(500).json({ error: error.message || 'Payment initiation failed' });
    }
}
