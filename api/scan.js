// api/scan.js
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { code, pin, action } = request.body;
    
    // 1. Sécurité Code PIN (Pour le Staff seulement)
    // Hna drna 1234, t9der tbdlo b environement variable ila bghiti
    if (pin !== "1234") { 
        return response.status(401).json({ status: "ERROR", message: "Code PIN Incorrect" });
    }

    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
    const SECRET_KEY = process.env.BK_SECRET;

    if (!GOOGLE_SCRIPT_URL || !SECRET_KEY) {
        return response.status(500).json({ status: "ERROR", message: "Server Config Error" });
    }

    try {
        // On prépare la demande pour Google
        const formData = new URLSearchParams();
        formData.append('key', SECRET_KEY);
        formData.append('action', 'check_qr'); // Action spéciale pour le scan
        formData.append('qr_code', code);
        
        // Si on veut marquer comme utilisé
        if (action === "consume") {
             formData.append('consume', 'true');
        }

        const googleRes = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });

        const data = await googleRes.json();
        return response.status(200).json(data);

    } catch (error) {
        return response.status(500).json({ status: "ERROR", message: "Erreur Connexion" });
    }
}