require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const conversationHandler = require('./bot/conversationHandler');
const whatsappService = require('./services/whatsappService');
const readline = require('readline');

const app = express();
app.use(bodyParser.json());

// LOGGING ÚNICO
app.use((req, res, next) => {
    console.log(`\n🔔 [${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// --- WEBHOOK DE WHATSAPP ---
app.get('/webhook', (req, res) => {
    const verify_token = process.env.VERIFY_TOKEN;

    if (!verify_token) {
        console.error('❌ VERIFY_TOKEN no configurado');
        return res.sendStatus(500);
    }

    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === verify_token) {
        console.log('✅ WEBHOOK_VERIFIED');
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.warn('⚠️ Verificación fallida');
        res.sendStatus(403);
    }
});

app.post('/webhook', async (req, res) => {
    console.log('📩 Webhook Event Recibido');

    try {
        const body = req.body;

        // Validación
        if (!body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
            console.log('⚠️ Webhook sin mensajes válidos');
            return res.sendStatus(200);
        }

        const msg = body.entry[0].changes[0].value.messages[0];
        const from = msg.from;

        // Extraer texto del mensaje
        let text = '';
        if (msg.text?.body) {
            text = msg.text.body;
        } else if (msg.interactive?.button_reply?.title) {
            text = msg.interactive.button_reply.title;
        } else if (msg.interactive?.list_reply?.title) {
            text = msg.interactive.list_reply.title;
        } else {
            console.warn('⚠️ Tipo de mensaje no soportado:', msg.type);
            return res.sendStatus(200);
        }

        console.log(`👤 Usuario ${from}: ${text}`);

        // Procesar mensaje
        const responses = await conversationHandler.handleIncomingMessage(from, text);

        // Enviar respuesta
        await whatsappService.sendBotResponse(from, responses);

        console.log('✅ Respuestas enviadas:', responses.length);

        res.sendStatus(200);

    } catch (error) {
        console.error('❌ Error procesando webhook:', error);
        res.sendStatus(500);
    }
});

// --- MODO CONSOLA ---
function startConsoleMode() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('\n🔵 --- MODO PRUEBA HÍBRIDO ---');

    rl.question('\n📱 Tu número (ej: 34600123456): ', (phoneInput) => {
        const myPhone = phoneInput.trim();
        console.log(`\n✅ Enviando a: ${myPhone}`);
        console.log('Escribe "Hola" para empezar.\n');

        const ask = () => {
            rl.question('Tú: ', async (input) => {
                if (input.toLowerCase() === 'salir') {
                    console.log('👋 Cerrando...');
                    rl.close();
                    return;
                }

                try {
                    const responses = await conversationHandler.handleIncomingMessage(myPhone, input);
                    await whatsappService.sendBotResponse(myPhone, responses);

                    responses.forEach(r => {
                        let extra = '';
                        if (r.type === 'interactive_list') {
                            extra = '\n   [OPCIONES]: ' + r.options.map(o => `"${o.title}"`).join(', ');
                        } else if (r.type === 'interactive_buttons') {
                            extra = '\n   [BOTONES]: ' + r.buttons.map(b => `[${b}]`).join(' ');
                        }
                        console.log(`🤖 Bot: ${r.body}${extra}`);
                    });
                } catch (error) {
                    console.error('❌ Error:', error.message);
                }

                ask();
            });
        };

        ask();
    });
}

// INICIAR SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor en puerto ${PORT}`);
    console.log(`📡 Webhook: http://localhost:${PORT}/webhook`);

    // Solo arrancar console mode en desarrollo (NO en production)
    if (process.env.NODE_ENV === 'production') {
        console.log('🚀 Modo PRODUCTION - servidor listo para webhooks');
    } else {
        console.log('🔵 Modo DEVELOPMENT - arrancando console mode');
        startConsoleMode();
    }
});
