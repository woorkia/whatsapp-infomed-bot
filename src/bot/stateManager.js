/**
 * Gestor de Estado en Memoria (Simple)
 * Guarda en qué paso de la reserva está cada número de teléfono.
 * En producción usaríamos Redis o una Base de Datos SQL.
 */
class StateManager {
    constructor() {
        this.userStates = new Map(); // Mapa: '34600123456' -> { step: 'SELECT_SERVICE', data: {...} }
    }

    getUserState(phoneNumber) {
        return this.userStates.get(phoneNumber) || { step: 'WELCOME', data: {} };
    }

    setUserState(phoneNumber, step, data = {}) {
        const currentState = this.getUserState(phoneNumber);
        this.userStates.set(phoneNumber, {
            step,
            data: { ...currentState.data, ...data } // Mantiene datos acumulados
        });
    }

    resetUserState(phoneNumber) {
        this.userStates.delete(phoneNumber);
    }
}

module.exports = new StateManager();
