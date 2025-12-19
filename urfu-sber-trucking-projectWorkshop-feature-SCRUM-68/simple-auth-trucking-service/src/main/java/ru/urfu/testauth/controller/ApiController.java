package ru.urfu.testauth.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.urfu.testauth.models.*;
import ru.urfu.testauth.repository.*;
import ru.urfu.testauth.service.AuthService;
import ru.urfu.testauth.service.OpenStreetApi;
import ru.urfu.testauth.service.OrderService;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:3003",
        "http://localhost:3001"
}, maxAge = 3600)
@Slf4j
public class ApiController {
    private final AuthService authService;
    private final OrderService orderService;
    private final OpenStreetApi openStreetApi;
    private final DriverRepository driverRepository;
    private final TruckRepository truckRepository;
    private final TrailerRepository trailerRepository;
    private final FleetAssignmentRepository fleetAssignmentRepository;

    static String validateFields(User user, boolean isLogin) {
        if (user.getInn() == null || user.getInn().isEmpty() || user.getPassword() == null || user.getPassword().isEmpty()) {
            return "ИНН и пароль обязательны";
        }
        if (!isLogin && (user.getCompany() == null || user.getCompany().isEmpty())) {
            return "Заполните все поля для регистрации";
        }
        return null;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody User user) {

        String err = validateFields(user, true);
        if (err != null) {
            return ResponseEntity.badRequest().body(Map.of("message", err));
        }
        User found = authService.login(user.getInn(), user.getPassword());
        if (found == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Неверный ИНН или пароль"));
        }
        return ResponseEntity.ok(Map.of("user", found));
    }

    @PostMapping("/auth/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        String err = validateFields(user, false);
        if (err != null) {
            return ResponseEntity.badRequest().body(Map.of("message", err));
        }
        try {
            User newUser = authService.register(user);
            return ResponseEntity.ok(newUser);
        } catch (Exception ex) {
            return ResponseEntity.status(409).body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/orders/create")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> request) {
        log.info("Запрос дошёл");
        List<String> required = List.of("shipperName", "managerName", "origin", "destination", "pickupDate", "deliveryDate", "transportationCost", "vehicleCount");
        List<String> missing = new ArrayList<>();
        for (String f : required)
            if (!request.containsKey(f) || request.get(f) == null || request.get(f).toString().isEmpty())
                missing.add(f);
        if (!missing.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("message", "Заполните все обязательные поля: " + String.join(", ", missing)));
        Double cost;
        Integer vehicleCount;
        try {
            cost = Double.parseDouble(request.get("transportationCost").toString());
            vehicleCount = Integer.parseInt(request.get("vehicleCount").toString());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message","Стоимость и количество транспорта должны быть числами"));
        }
        if (cost <= 0) return ResponseEntity.badRequest().body(Map.of("message", "Стоимость должна быть положительным числом"));
        if (vehicleCount < 1 || vehicleCount > 5) return ResponseEntity.badRequest().body(Map.of("message", "Количество транспорта должно быть от 1 до 5"));
        try {
            LocalDate pickupDate = LocalDate.parse(request.get("pickupDate").toString());
            LocalDate deliveryDate = LocalDate.parse(request.get("deliveryDate").toString());
            if (pickupDate.isAfter(deliveryDate)) {
                return ResponseEntity.badRequest().body(Map.of("message","Дата погрузки не может быть позже даты доставки"));
            }
            List<Order> orders = new ArrayList<>();
            for (int i = 0; i < vehicleCount; i++) {
                Order.OrderBuilder builder = Order.builder()
                        .shipperName((String) request.get("shipperName"))
                        .managerName((String) request.get("managerName"))
                        .origin((String) request.get("origin"))
                        .destination((String) request.get("destination"))
                        .originLatitude(request.get("originLatitude")==null?null:Double.valueOf(request.get("originLatitude").toString()))
                        .originLongitude(request.get("originLongitude")==null?null:Double.valueOf(request.get("originLongitude").toString()))
                        .destinationLatitude(request.get("destinationLatitude")==null?null:Double.valueOf(request.get("destinationLatitude").toString()))
                        .destinationLongitude(request.get("destinationLongitude")==null?null:Double.valueOf(request.get("destinationLongitude").toString()))
                        .trailerType((String) request.getOrDefault("trailerType", null))
                        .volume(request.get("volume") == null ? 0.0 : Double.valueOf(request.get("volume").toString().replaceAll("[^\\d.-]", "")))                        .weight(request.get("weight")==null?null:Double.valueOf(request.get("weight").toString()))
                        .pickupDate(pickupDate)
                        .pickupTime(request.get("pickupTime")==null?null:LocalTime.parse(request.get("pickupTime").toString()))
                        .deliveryDate(deliveryDate)
                        .deliveryTime(request.get("deliveryTime")==null?null: LocalTime.parse(request.get("deliveryTime").toString()))
                        .cargoType((String) request.getOrDefault("cargoType", null))
                        .specialRequirements((String) request.getOrDefault("specialRequirements", ""))
                        .transportationCost(cost)
                        .length(request.get("length")==null?null:Double.valueOf(request.get("length").toString()))
                        .width(request.get("width")==null?null:Double.valueOf(request.get("width").toString()))
                        .height(request.get("height")==null?null:Double.valueOf(request.get("height").toString()))
                        .vehicleCount(1)
                        .externalOrderNumber((String) request.getOrDefault("externalOrderNumber", null))
                        .status("Ожидает")
                        .assignedDriverId(null);
                orders.add(orderService.createOrder(builder.build()));
            }
            return ResponseEntity.status(201).body(Map.of(
                    "order", orders.get(0),
                    "createdCount", orders.size()
            ));
        } catch (Exception e) {
            log.error("Ошибка при создании заказа: ", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Ошибка сервера при создании заказа"));
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getAllOrders() {
        List<Order> orders = orderService.getAllOrders();
        return ResponseEntity.ok(Map.of("orders", orders));
    }

    @PostMapping("/orders/{id}/status")
    public ResponseEntity<?> getStatus() {
        return ResponseEntity.ok("ok");
    }

    @DeleteMapping("/orders/{id}")
    public ResponseEntity<?> deleteOrder(@PathVariable Long id) {
        try {
            orderService.deleteOrder(id);
            return ResponseEntity.ok(Map.of("message", "Заказ удален"));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("message", "Заказ не найден"));
        }
    }
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = authService.getAllUsers();
        return ResponseEntity.ok(Map.of("users", users));
    }

    @GetMapping("/test")
    public ResponseEntity<GeocodingResponse> testController(@RequestParam String address){
        return ResponseEntity.ok(openStreetApi.getCoordinates(address));
    }

    // ==================== DRIVERS CRUD ====================
    @GetMapping("/drivers")
    public ResponseEntity<?> getAllDrivers() {
        List<Driver> drivers = driverRepository.findAll();
        return ResponseEntity.ok(Map.of("drivers", drivers));
    }

    @GetMapping("/drivers/{id}")
    public ResponseEntity<?> getDriverById(@PathVariable String id) {
        return driverRepository.findById(id)
                .map(driver -> ResponseEntity.ok(driver))
                .orElse(ResponseEntity.status(404).body((Driver) Map.of("message", "Водитель не найден")));
    }

    @PostMapping("/drivers")
    public ResponseEntity<?> createDriver(@RequestBody Map<String, Object> request) {
        log.info("Получен запрос на создание водителя: {}", request);

        List<String> required = List.of("id", "name", "phone", "licenseNumber");
        List<String> missing = new ArrayList<>();
        for (String f : required) {
            if (!request.containsKey(f) || request.get(f) == null || request.get(f).toString().trim().isEmpty()) {
                missing.add(f);
            }
        }
        if (!missing.isEmpty()) {
            log.warn("Отсутствуют обязательные поля: {}", missing);
            return ResponseEntity.badRequest().body(Map.of("message", "Заполните все обязательные поля: " + String.join(", ", missing)));
        }

        // Проверка уникальности licenseNumber
        String licenseNumber = request.get("licenseNumber").toString().trim();
        if (driverRepository.findByLicenseNumber(licenseNumber).isPresent()) {
            log.warn("Попытка создать водителя с существующим номером удостоверения: {}", licenseNumber);
            return ResponseEntity.status(409).body(Map.of("message", "Водитель с таким номером удостоверения уже существует"));
        }

        try {
            String id = request.get("id").toString().trim();
            String name = request.get("name").toString().trim();
            String phone = request.get("phone").toString().trim();
            String availability = request.getOrDefault("availability", "Доступен").toString().trim();
            String comment = request.getOrDefault("comment", "").toString();

            // Проверка, что водитель с таким ID не существует
            if (driverRepository.existsById(id)) {
                log.warn("Попытка создать водителя с существующим ID: {}", id);
                return ResponseEntity.status(409).body(Map.of("message", "Водитель с таким ID уже существует"));
            }

            Driver driver = Driver.builder()
                    .id(id)
                    .name(name)
                    .phone(phone)
                    .licenseNumber(licenseNumber)
                    .availability(availability.isEmpty() ? "Доступен" : availability)
                    .comment(comment != null ? comment : "")
                    .build();

            log.info("Создание водителя: {}", driver);
            Driver saved = driverRepository.save(driver);
            log.info("Водитель успешно создан: {}", saved.getId());
            return ResponseEntity.status(201).body(saved);
        } catch (Exception e) {
            log.error("Ошибка при создании водителя: ", e);
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", "Ошибка сервера при создании водителя: " + e.getMessage()));
        }
    }

    @PutMapping("/drivers/{id}")
    public ResponseEntity<?> updateDriver(@PathVariable String id, @RequestBody Map<String, Object> request) {
        return driverRepository.findById(id)
                .map(existing -> {
                    if (request.containsKey("name")) existing.setName(request.get("name").toString());
                    if (request.containsKey("phone")) existing.setPhone(request.get("phone").toString());
                    if (request.containsKey("licenseNumber")) {
                        String newLicense = request.get("licenseNumber").toString();
                        if (!existing.getLicenseNumber().equals(newLicense) &&
                            driverRepository.findByLicenseNumber(newLicense).isPresent()) {
                            return ResponseEntity.status(409).body(Map.of("message", "Водитель с таким номером удостоверения уже существует"));
                        }
                        existing.setLicenseNumber(newLicense);
                    }
                    if (request.containsKey("availability")) existing.setAvailability(request.get("availability").toString());
                    if (request.containsKey("comment")) existing.setComment(request.get("comment").toString());
                    Driver updated = driverRepository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.status(404).body(Map.of("message", "Водитель не найден")));
    }

    @DeleteMapping("/drivers/{id}")
    public ResponseEntity<?> deleteDriver(@PathVariable String id) {
        try {
            if (!driverRepository.existsById(id)) {
                return ResponseEntity.status(404).body(Map.of("message", "Водитель не найден"));
            }
            driverRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Водитель удален"));
        } catch (Exception e) {
            log.error("Ошибка при удалении водителя: ", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Ошибка при удалении водителя"));
        }
    }

    // ==================== TRUCKS CRUD ====================
    @GetMapping("/trucks")
    public ResponseEntity<?> getAllTrucks() {
        List<Truck> trucks = truckRepository.findAll();
        return ResponseEntity.ok(Map.of("trucks", trucks));
    }

    @GetMapping("/trucks/{id}")
    public ResponseEntity<?> getTruckById(@PathVariable String id) {
        return truckRepository.findById(id)
                .map(truck -> ResponseEntity.ok(truck))
                .orElse(ResponseEntity.status(404).body((Truck) Map.of("message", "Транспортное средство не найдено")));
    }

    @PostMapping("/trucks")
    public ResponseEntity<?> createTruck(@RequestBody Map<String, Object> request) {
        List<String> required = List.of("id", "make", "model", "year", "licensePlate", "vinNumber");
        List<String> missing = new ArrayList<>();
        for (String f : required) {
            if (!request.containsKey(f) || request.get(f) == null || request.get(f).toString().isEmpty()) {
                missing.add(f);
            }
        }
        if (!missing.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Заполните все обязательные поля: " + String.join(", ", missing)));
        }

        // Проверка уникальности
        if (truckRepository.findByLicensePlate(request.get("licensePlate").toString()).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("message", "Транспортное средство с таким номером уже существует"));
        }
        if (truckRepository.findByVinNumber(request.get("vinNumber").toString()).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("message", "Транспортное средство с таким VIN уже существует"));
        }

        try {
            Truck truck = Truck.builder()
                    .id(request.get("id").toString())
                    .make(request.get("make").toString())
                    .model(request.get("model").toString())
                    .year(Integer.parseInt(request.get("year").toString()))
                    .licensePlate(request.get("licensePlate").toString())
                    .vinNumber(request.get("vinNumber").toString())
                    .maintenanceStatus(request.getOrDefault("maintenanceStatus", "Исправен").toString())
//                    .currentLocation(request.get("currentLocation").toString())
                    .comment(request.getOrDefault("comment", "").toString())
                    .build();
            Truck saved = truckRepository.save(truck);
            return ResponseEntity.status(201).body(saved);
        } catch (Exception e) {
            log.error("Ошибка при создании транспортного средства: ", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Ошибка сервера при создании транспортного средства"));
        }
    }

    @PutMapping("/trucks/{id}")
    public ResponseEntity<?> updateTruck(@PathVariable String id, @RequestBody Map<String, Object> request) {
        return truckRepository.findById(id)
                .map(existing -> {
                    if (request.containsKey("make")) existing.setMake(request.get("make").toString());
                    if (request.containsKey("model")) existing.setModel(request.get("model").toString());
                    if (request.containsKey("year")) existing.setYear(Integer.parseInt(request.get("year").toString()));
                    if (request.containsKey("licensePlate")) {
                        String newPlate = request.get("licensePlate").toString();
                        if (!existing.getLicensePlate().equals(newPlate) &&
                            truckRepository.findByLicensePlate(newPlate).isPresent()) {
                            return ResponseEntity.status(409).body(Map.of("message", "Транспортное средство с таким номером уже существует"));
                        }
                        existing.setLicensePlate(newPlate);
                    }
                    if (request.containsKey("vinNumber")) {
                        String newVin = request.get("vinNumber").toString();
                        if (!existing.getVinNumber().equals(newVin) &&
                            truckRepository.findByVinNumber(newVin).isPresent()) {
                            return ResponseEntity.status(409).body(Map.of("message", "Транспортное средство с таким VIN уже существует"));
                        }
                        existing.setVinNumber(newVin);
                    }
                    if (request.containsKey("maintenanceStatus")) existing.setMaintenanceStatus(request.get("maintenanceStatus").toString());
//                    if (request.containsKey("currentLocation")) existing.setCurrentLocation(request.get("currentLocation").toString());
                    if (request.containsKey("comment")) existing.setComment(request.get("comment").toString());
                    Truck updated = truckRepository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.status(404).body(Map.of("message", "Транспортное средство не найдено")));
    }

    @DeleteMapping("/trucks/{id}")
    public ResponseEntity<?> deleteTruck(@PathVariable String id) {
        try {
            if (!truckRepository.existsById(id)) {
                return ResponseEntity.status(404).body(Map.of("message", "Транспортное средство не найдено"));
            }
            truckRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Транспортное средство удалено"));
        } catch (Exception e) {
            log.error("Ошибка при удалении транспортного средства: ", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Ошибка при удалении транспортного средства"));
        }
    }

    // ==================== TRAILERS CRUD ====================
    @GetMapping("/trailers")
    public ResponseEntity<?> getAllTrailers() {
        List<Trailer> trailers = trailerRepository.findAll();
        return ResponseEntity.ok(Map.of("trailers", trailers));
    }

    @GetMapping("/trailers/{id}")
    public ResponseEntity<?> getTrailerById(@PathVariable String id) {
        return trailerRepository.findById(id)
                .map(trailer -> ResponseEntity.ok(trailer))
                .orElse(ResponseEntity.status(404).body((Trailer) Map.of("message", "Прицеп не найден")));
    }

    @PostMapping("/trailers")
    public ResponseEntity<?> createTrailer(@RequestBody Map<String, Object> request) {
        List<String> required = List.of("id", "licensePlate", "trailerType", "length", "width", "height", "volume");
        List<String> missing = new ArrayList<>();
        for (String f : required) {
            if (!request.containsKey(f) || request.get(f) == null || request.get(f).toString().isEmpty()) {
                missing.add(f);
            }
        }
        if (!missing.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Заполните все обязательные поля: " + String.join(", ", missing)));
        }

        // Проверка уникальности
        if (trailerRepository.findByLicensePlate(request.get("licensePlate").toString()).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("message", "Прицеп с таким номером уже существует"));
        }

        try {
            Trailer trailer = Trailer.builder()
                    .id(request.get("id").toString())
                    .licensePlate(request.get("licensePlate").toString())
                    .trailerType(request.get("trailerType").toString())
                    .length(request.get("length").toString())
                    .width(request.get("width").toString())
                    .height(request.get("height").toString())
                    .volume(request.get("volume").toString())
                    .comment(request.getOrDefault("comment", "").toString())
                    .build();
            Trailer saved = trailerRepository.save(trailer);
            return ResponseEntity.status(201).body(saved);
        } catch (Exception e) {
            log.error("Ошибка при создании прицепа: ", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Ошибка сервера при создании прицепа"));
        }
    }

    @PutMapping("/trailers/{id}")
    public ResponseEntity<?> updateTrailer(@PathVariable String id, @RequestBody Map<String, Object> request) {
        return trailerRepository.findById(id)
                .map(existing -> {
                    if (request.containsKey("licensePlate")) {
                        String newPlate = request.get("licensePlate").toString();
                        if (!existing.getLicensePlate().equals(newPlate) &&
                            trailerRepository.findByLicensePlate(newPlate).isPresent()) {
                            return ResponseEntity.status(409).body(Map.of("message", "Прицеп с таким номером уже существует"));
                        }
                        existing.setLicensePlate(newPlate);
                    }
                    if (request.containsKey("trailerType")) existing.setTrailerType(request.get("trailerType").toString());
                    if (request.containsKey("length")) existing.setLength(request.get("length").toString());
                    if (request.containsKey("width")) existing.setWidth(request.get("width").toString());
                    if (request.containsKey("height")) existing.setHeight(request.get("height").toString());
                    if (request.containsKey("volume")) existing.setVolume(request.get("volume").toString());
                    if (request.containsKey("comment")) existing.setComment(request.get("comment").toString());
                    Trailer updated = trailerRepository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.status(404).body(Map.of("message", "Прицеп не найден")));
    }

    @DeleteMapping("/trailers/{id}")
    public ResponseEntity<?> deleteTrailer(@PathVariable String id) {
        try {
            if (!trailerRepository.existsById(id)) {
                return ResponseEntity.status(404).body(Map.of("message", "Прицеп не найден"));
            }
            trailerRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Прицеп удален"));
        } catch (Exception e) {
            log.error("Ошибка при удалении прицепа: ", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Ошибка при удалении прицепа"));
        }
    }

    // ==================== FLEET ASSIGNMENTS CRUD ====================
    @GetMapping("/fleet-assignments")
    public ResponseEntity<?> getAllFleetAssignments() {
        List<FleetAssignment> assignments = fleetAssignmentRepository.findAll();
        return ResponseEntity.ok(Map.of("assignments", assignments));
    }

    @GetMapping("/fleet-assignments/{id}")
    public ResponseEntity<?> getFleetAssignmentById(@PathVariable String id) {
        return fleetAssignmentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body((FleetAssignment) Map.of("message", "Связка не найдена")));
    }

    @PostMapping("/fleet-assignments")
    public ResponseEntity<?> createFleetAssignment(@RequestBody Map<String, Object> request) {
        List<String> required = List.of("id", "driverId", "truckId", "trailerId", "assignedDate");
        List<String> missing = new ArrayList<>();
        for (String f : required) {
            if (!request.containsKey(f) || request.get(f) == null || request.get(f).toString().isEmpty()) {
                missing.add(f);
            }
        }
        if (!missing.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Заполните все обязательные поля: " + String.join(", ", missing)));
        }

        String driverId = request.get("driverId").toString();
        String truckId = request.get("truckId").toString();
        String trailerId = request.get("trailerId").toString();

        // Проверка существования связанных сущностей
        if (!driverRepository.existsById(driverId)) {
            return ResponseEntity.status(404).body(Map.of("message", "Водитель не найден"));
        }
        if (!truckRepository.existsById(truckId)) {
            return ResponseEntity.status(404).body(Map.of("message", "Транспортное средство не найдено"));
        }
        if (!trailerRepository.existsById(trailerId)) {
            return ResponseEntity.status(404).body(Map.of("message", "Прицеп не найден"));
        }

        // Проверка уникальности комбинации
        if (fleetAssignmentRepository.findByDriverIdAndTruckIdAndTrailerId(driverId, truckId, trailerId).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("message", "Такая связка уже существует"));
        }

        try {
            FleetAssignment assignment = FleetAssignment.builder()
                    .id(request.get("id").toString())
                    .driverId(driverId)
                    .truckId(truckId)
                    .trailerId(trailerId)
                    .assignedDate(request.get("assignedDate").toString())
                    .build();
            FleetAssignment saved = fleetAssignmentRepository.save(assignment);
            return ResponseEntity.status(201).body(saved);
        } catch (Exception e) {
            log.error("Ошибка при создании связки: ", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Ошибка сервера при создании связки"));
        }
    }

    @PutMapping("/fleet-assignments/{id}")
    public ResponseEntity<?> updateFleetAssignment(@PathVariable String id, @RequestBody Map<String, Object> request) {
        return fleetAssignmentRepository.findById(id)
                .map(existing -> {
                    if (request.containsKey("driverId")) {
                        String newDriverId = request.get("driverId").toString();
                        if (!driverRepository.existsById(newDriverId)) {
                            return ResponseEntity.status(404).body(Map.of("message", "Водитель не найден"));
                        }
                        existing.setDriverId(newDriverId);
                    }
                    if (request.containsKey("truckId")) {
                        String newTruckId = request.get("truckId").toString();
                        if (!truckRepository.existsById(newTruckId)) {
                            return ResponseEntity.status(404).body(Map.of("message", "Транспортное средство не найдено"));
                        }
                        existing.setTruckId(newTruckId);
                    }
                    if (request.containsKey("trailerId")) {
                        String newTrailerId = request.get("trailerId").toString();
                        if (!trailerRepository.existsById(newTrailerId)) {
                            return ResponseEntity.status(404).body(Map.of("message", "Прицеп не найден"));
                        }
                        existing.setTrailerId(newTrailerId);
                    }
                    if (request.containsKey("assignedDate")) existing.setAssignedDate(request.get("assignedDate").toString());

                    // Проверка уникальности новой комбинации
                    String driverId = existing.getDriverId();
                    String truckId = existing.getTruckId();
                    String trailerId = existing.getTrailerId();
                    Optional<FleetAssignment> duplicate = fleetAssignmentRepository.findByDriverIdAndTruckIdAndTrailerId(driverId, truckId, trailerId);
                    if (duplicate.isPresent() && !duplicate.get().getId().equals(id)) {
                        return ResponseEntity.status(409).body(Map.of("message", "Такая связка уже существует"));
                    }

                    FleetAssignment updated = fleetAssignmentRepository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.status(404).body(Map.of("message", "Связка не найдена")));
    }

    @DeleteMapping("/fleet-assignments/{id}")
    public ResponseEntity<?> deleteFleetAssignment(@PathVariable String id) {
        try {
            if (!fleetAssignmentRepository.existsById(id)) {
                return ResponseEntity.status(404).body(Map.of("message", "Связка не найдена"));
            }
            fleetAssignmentRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Связка удалена"));
        } catch (Exception e) {
            log.error("Ошибка при удалении связки: ", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Ошибка при удалении связки"));
        }
    }
}
