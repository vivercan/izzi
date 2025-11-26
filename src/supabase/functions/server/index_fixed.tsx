// SOLO SECCIÓN CORREGIDA - LÍNEAS 1103-1115
        
        // Parsear XML para extraer todos los valores necesarios
        const latMatch = responseText.match(/<Latitude>([-\d.]+)<\/Latitude>/);
        const lngMatch = responseText.match(/<Longitude>([-\d.]+)<\/Longitude>/);
        const speedMatch = responseText.match(/<Speed>([\d.]+)<\/Speed>/);
        const headingMatch = responseText.match(/<Heading>([^<]+)<\/Heading>/);
        const locationMatch = responseText.match(/<Location><!\[CDATA\[([^\]]+)\]\]><\/Location>/);
        const dateTimeMatch = responseText.match(/<DateTimeGPS>([^<]+)<\/DateTimeGPS>/);
        const odometerMatch = responseText.match(/<Odometer>([\d.]+)<\/Odometer>/);
        const ignitionMatch = responseText.match(/<Ignition>([01])<\/Ignition>/);
        
        // Parsear temperaturas (S1 y S2)
        const temp1Match = responseText.match(/<S1[^>]*>([-\d.]+)<\/S1>/);
        const temp2Match = responseText.match(/<S2[^>]*>([-\d.]+)<\/S2>/);
