const twilio = require('twilio');

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

let client = null;
if (sid && token) {
  client = twilio(sid, token);
} else {
  console.warn('⚠️ Twilio Account SID or Auth Token missing. WhatsApp alerts will run in simulation mode.');
}

async function sendWhatsApp(toPhone, message) {
  try {
    if (!client) {
      console.log(`[SIMULATED WHATSAPP] to +${toPhone}:\n${message}\n----------------------------------`);
      return { success: true, sid: 'simulated_' + Math.random().toString(36).substring(2, 11) };
    }
    
    const formattedTo = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:+${toPhone}`;
    const result = await client.messages.create({
      from: fromPhone,
      to: formattedTo,
      body: message
    });
    return { success: true, sid: result.sid };
  } catch (err) {
    console.error('WhatsApp send error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendWhatsApp };
