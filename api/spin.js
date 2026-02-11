export default async function handler(request, response) {
    // 1. Only allow POST requests
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 2. Get Secrets from Vercel Environment (Safe & Hidden)
        const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
        const SECRET_KEY = process.env.BK_SECRET;

        if (!GOOGLE_SCRIPT_URL || !SECRET_KEY) {
            throw new Error("Missing Server Configuration");
        }

        // 3. Get data from your Frontend (JSON)
        const body = request.body;

        // 4. Prepare data for Google Apps Script (Convert JSON to Form Data)
        // We inject the SECRET_KEY here. The user never sees it.
        const formData = new URLSearchParams();
        formData.append('key', SECRET_KEY); 
        formData.append('action', body.action);
        
        // Add optional fields if they exist
        if (body.name) formData.append('name', body.name);
        if (body.email) formData.append('email', body.email);
        if (body.phone) formData.append('phone', body.phone);
        if (body.city) formData.append('city', body.city);

        // 5. Send to Google
        const googleResponse = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: formData, 
        });

        // 6. Return Google's response to your Frontend
        const data = await googleResponse.json();
        return response.status(200).json(data);

    } catch (error) {
        console.error("Vercel Error:", error);
        return response.status(500).json({ status: "ERROR", message: "Server Error" });
    }
}