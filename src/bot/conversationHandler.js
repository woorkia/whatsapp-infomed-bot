const infomedService = require('../services/infomedMock');
const stateManager = require('./stateManager');

/**
 * Cerebro de la Conversación
 * Procesa el mensaje entrante y decide qué responder.
 */
class ConversationHandler {

    async handleIncomingMessage(phoneNumber, messageText, messageType = 'text') {
        // 1. Recuperar estado actual del usuario
        const state = stateManager.getUserState(phoneNumber);
        let response = [];

        console.log(`[BOT] Usuario: ${phoneNumber} | Estado: ${state.step} | Input: ${messageText}`);

        // MÁQUINA DE ESTADOS
        switch (state.step) {
            case 'WELCOME':
                response = await this.startFlow(phoneNumber);
                break;

            case 'SELECT_SERVICE':
                response = await this.handleServiceSelection(phoneNumber, messageText);
                break;

            case 'SELECT_DATE':
                response = await this.handleDateSelection(phoneNumber, messageText, state.data);
                break;

            case 'SELECT_TIME':
                response = await this.handleTimeSelection(phoneNumber, messageText, state.data);
                break;

            case 'CONFIRM_NAME':
                response = await this.handleNameInput(phoneNumber, messageText, state.data);
                break;

            default:
                response = [{ type: 'text', body: 'Lo siento, me he perdido. Escribe "Hola" para empezar de nuevo.' }];
                stateManager.resetUserState(phoneNumber);
        }

        return response;
    }

    // --- PASO 1: Inicio ---
    async startFlow(phoneNumber) {
        const services = await infomedService.getServices();

        // Guardamos estado
        stateManager.setUserState(phoneNumber, 'SELECT_SERVICE');

        // Construimos menú de botones
        return [{
            type: 'interactive_list',
            title: 'Bienvenido a Clínica Dental',
            body: 'Por favor, selecciona el servicio que necesitas:',
            options: services.map(s => ({ id: s.id, title: s.name }))
        }];
    }

    // --- PASO 2: Elegir Servicio ---
    async handleServiceSelection(phoneNumber, input) {
        const services = await infomedService.getServices();
        const selectedService = services.find(s => s.name.toLowerCase().includes(input.toLowerCase()) || s.id === input);

        if (!selectedService) {
            return [{ type: 'text', body: '❌ No he entendido qué servicio quieres. Por favor elige uno de la lista.' }];
        }

        stateManager.setUserState(phoneNumber, 'SELECT_DATE', { service: selectedService });

        return [{
            type: 'text',
            body: `✅ Has elegido: *${selectedService.name}*\n\nPor favor, escribe la fecha que prefieres (Ej: "Mañana", "Lunes", "2024-03-01")`
        }];
    }

    // --- PASO 3: Elegir Fecha (Simulado NLP simple) ---
    async handleDateSelection(phoneNumber, input, data) {
        // Aquí normalmente usaríamos una librería para parsear fechas reales.
        // Asumiremos que el input es válido para la demo.
        const dateStr = input;

        // Consultar API Infomed
        const slots = await infomedService.getAvailableSlots(dateStr, data.service.id);

        stateManager.setUserState(phoneNumber, 'SELECT_TIME', { date: dateStr });

        if (slots.length === 0) {
            return [{ type: 'text', body: 'Lo siento, no hay huecos ese día. Prueba con otra fecha.' }];
            // (Aquí no cambiamos de estado para dejarle probar otra fecha)
        }

        return [{
            type: 'interactive_buttons',
            body: `📅 Huecos libres para el ${dateStr}:`,
            buttons: slots.map(s => s.time).slice(0, 3) // WhatsApp limita botones a 3, usaremos lista si hay más
        }];
    }

    // --- PASO 4: Elegir Hora ---
    async handleTimeSelection(phoneNumber, input, data) {
        stateManager.setUserState(phoneNumber, 'CONFIRM_NAME', { time: input });

        return [{
            type: 'text',
            body: `Perfecto, ${data.service.name} el ${data.date} a las ${input}.\n\n👤 Para terminar, escribe tu Nombre y Apellido.`
        }];
    }

    // --- PASO 5: Confirmar y Guardar ---
    async handleNameInput(phoneNumber, input, data) {
        const fullName = input;

        // LLAMADA FINAL A INFOMED
        const result = await infomedService.createAppointment(
            { name: fullName, phone: phoneNumber },
            { serviceId: data.service.id, date: data.date, time: data.time }
        );

        stateManager.resetUserState(phoneNumber); // Reset para nueva reserva

        return [{
            type: 'text',
            body: `🎉 *¡Cita Confirmada!*\n\nPaciente: ${fullName}\nTratamiento: ${data.service.name}\nFecha: ${data.date} a las ${data.time}\nRef: #${result.bookingId}\n\nTe esperamos.`
        }];
    }
}

module.exports = new ConversationHandler();
