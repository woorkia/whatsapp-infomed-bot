# Bot de Citas WhatsApp + Infomed (Simulación)

Este proyecto es el "cerebro" de tu chatbot. Ahora mismo funciona en modo demostración.

## ¿Qué hace?
1. **Simula ser WhatsApp**: Puedes hablar con él por la terminal.
2. **Simula ser Infomed**: Tiene una agenda falsa para darte citas.
3. **Flujo completo**: Te pide servicio -> fecha -> hora -> nombre.

## Cómo probarlo YA
1. Abre una terminal en esta carpeta.
2. Ejecuta:
   ```bash
   node src/index.js
   ```
3. Verás que dice "MODO SIMULACIÓN ACTIVADO".
4. Escribe `Hola` y dale a Enter.
5. Sigue las instrucciones (escribe el nombre del servicio, la fecha, etc).

## Siguientes Pasos (Para hacerlo real)
1. **Conectar a Meta**: Necesitamos una cuenta de WhatsApp Cloud API.
2. **Conectar a Infomed**: Cambiar el archivo `src/services/infomedMock.js` por la conexión real cuando nos den la documentación.
