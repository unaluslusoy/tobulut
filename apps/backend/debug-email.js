
const Brevo = require('@getbrevo/brevo');

async function testEmail() {
    const apiInstance = new Brevo.TransactionalEmailsApi();
    const apiKey = "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"; // Hardcoding for debug purposes based on .env view
    
    apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = "Test Email";
    sendSmtpEmail.htmlContent = "<html><body><h1>This is a test</h1></body></html>";
    sendSmtpEmail.sender = { name: "To Bulut Sistem", email: "no-reply@tobulut.com" };
    sendSmtpEmail.to = [{ email: "unaluslusoy@todestek.net" }];

    try {
        console.log("Sending email...");
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    } catch (error) {
        console.error('Error sending email:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Body:', JSON.stringify(error.response.body || error.body)); // Brevo SDK might put body in error.body
            console.error('Text:', error.response.text);
        } else {
            console.error(error);
        }
    }
}

testEmail();
