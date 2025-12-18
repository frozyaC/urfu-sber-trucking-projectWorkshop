package ru.urfu.matchservice.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.urfu.matchservice.models.CoordinatesDateDTO;
import ru.urfu.matchservice.models.DriverResponseDTO;
import ru.urfu.matchservice.service.DriverService;

import java.util.List;

@RestController
@CrossOrigin(origins = {
        "http://localhost:3003",
        "http://localhost:3001"
}, maxAge = 3600)
public class DriverController {
    private static final Logger log = LoggerFactory.getLogger(DriverController.class);
    private DriverService driverService;

    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    @PostMapping("/api/calculate")
    public ResponseEntity<?> getPriorityDrivers(
            @RequestBody CoordinatesDateDTO coordinatesDateDTO
    ){
        log.info("Поступил запрос: {}", coordinatesDateDTO.toString());
        
        try {
            List<DriverResponseDTO> drivers = driverService.getDrivers(coordinatesDateDTO);
            if (drivers == null || drivers.isEmpty()) {
                return ResponseEntity.ok(java.util.Map.of(
                    "message", "Нет доступных водителей на данный момент",
                    "drivers", java.util.Collections.emptyList()
                ));
            }
            return ResponseEntity.ok(drivers);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("No drivers are free")) {
                log.warn("Нет доступных водителей: {}", e.getMessage());
                return ResponseEntity.ok(java.util.Map.of(
                    "message", "Нет доступных водителей на данный момент",
                    "drivers", java.util.Collections.emptyList()
                ));
            }
            log.error("Ошибка при получении водителей: ", e);
            return ResponseEntity.status(500).body(java.util.Map.of(
                "message", "Ошибка сервера при поиске водителей",
                "error", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Неожиданная ошибка при получении водителей: ", e);
            return ResponseEntity.status(500).body(java.util.Map.of(
                "message", "Ошибка сервера при поиске водителей",
                "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/api/calculate/assign")
    public ResponseEntity<String> assignDriver(
    ){
        return ResponseEntity.ok("ok");
    }
}
