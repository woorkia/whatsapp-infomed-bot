/**
 * Simulación de la API de Infomed (Gesden)
 * En un entorno real, aquí haríamos llamadas HTTP con axios a su servicio SOAP/REST.
 */
class InfomedService {
  constructor() {
    this.services = [
      { id: '1', name: 'Limpieza Dental', duration: 30 },
      { id: '2', name: 'Revisión General', duration: 15 },
      { id: '3', name: 'Blanqueamiento', duration: 60 }
    ];
  }

  // Obtener lista de tratamientos disponibles
  async getServices() {
    // Simula retardo de red
    return new Promise(resolve => setTimeout(() => resolve(this.services), 500));
  }

  // Obtener huecos libres para una fecha
  async getAvailableSlots(date, serviceId) {
    // Aquí la lógica real consultaría la agenda de Infomed.
    // Nosotros devolveremos huecos ficticios variados según el día.
    
    // Simula retardo
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`[INFOMED API] Buscando huecos para el servicio ${serviceId} en fecha ${date}`);

    // Huecos falsos (Hardcoded para demostración)
    return [
      { time: '09:00', doctor: 'Dr. García' },
      { time: '10:30', doctor: 'Dra. Pérez' },
      { time: '12:00', doctor: 'Dr. García' },
      { time: '16:00', doctor: 'Dra. Pérez' },
      { time: '17:30', doctor: 'Dr. García' }
    ];
  }

  // Crear la cita en el sistema
  async createAppointment(clientData, slotData) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const bookingId = Math.floor(Math.random() * 100000);
    console.log(`[INFOMED API] CITA CREADA: ID #${bookingId}`, { clientData, slotData });
    return { success: true, bookingId };
  }
}

module.exports = new InfomedService();
