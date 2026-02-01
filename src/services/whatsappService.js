const axios = require('axios');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const VERSION = 'v17.0';

const client = axios.create({
    baseURL: `https://graph.facebook.com/${VERSION}`,
    headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

class WhatsappService {

    async sendMessage(to, messageData) {
        if (!WHATSAPP_PHONE_ID) {
            console.error('❌ Falta WHATSAPP_PHONE_ID en .env');
            return;
        }

        try {
            const url = `/${WHATSAPP_PHONE_ID}/messages`;
            const payload = {
                messaging_product: 'whatsapp',
                to: to,
                ...messageData
            };

            const response = await client.post(url, payload);
            console.log(`✅ Mensaje enviado a ${to}:`, response.data);
            return response.data;

        } catch (error) {
            console.error('❌ Error enviando mensaje a WhatsApp:', error.response ? error.response.data : (error.message || error));
            throw error;
        }
    }

    // Convertir formato interno del bot al formato de Meta
    async sendBotResponse(to, botResponses) {
        for (const response of botResponses) {
            let messagePayload = {};

            if (response.type === 'text') {
                messagePayload = {
                    type: 'text',
                    text: { body: response.body }
                };
            } else if (response.type === 'interactive_list') {
                messagePayload = {
                    type: 'interactive',
                    interactive: {
                        type: 'list',
                        header: {
                            type: 'text',
                            text: response.title.substring(0, 60)
                        },
                        body: {
                            text: response.body
                        },
                        action: {
                            button: 'Ver Opciones',
                            sections: [
                                {
                                    title: 'Opciones',
                                    rows: response.options.map(opt => ({
                                        id: opt.id,
                                        title: opt.title.substring(0, 24)
                                    }))
                                }
                            ]
                        }
                    }
                };
            } else if (response.type === 'interactive_buttons') {
                messagePayload = {
                    type: 'interactive',
                    interactive: {
                        type: 'button',
                        body: {
                            text: response.body
                        },
                        action: {
                            buttons: response.buttons.map((btn, index) => ({
                                type: 'reply',
                                reply: {
                                    id: index.toString(),
                                    title: btn.substring(0, 20)
                                }
                            }))
                        }
                    }
                };
            }

            if (messagePayload.type) {
                await this.sendMessage(to, messagePayload);
            }
        }
    }
}

module.exports = new WhatsappService();
