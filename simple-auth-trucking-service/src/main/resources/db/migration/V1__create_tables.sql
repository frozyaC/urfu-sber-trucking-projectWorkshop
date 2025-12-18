CREATE TABLE users (
                       inn VARCHAR(12) PRIMARY KEY,
                       name VARCHAR(255) NOT NULL,
                       company VARCHAR(255) NOT NULL,
                       userType VARCHAR(20) NOT NULL
);

CREATE TABLE drivers (
                         id VARCHAR(50) PRIMARY KEY,
                         name VARCHAR(255) NOT NULL,
                         phone VARCHAR(20) NOT NULL,
                         licenseNumber VARCHAR(50) NOT NULL UNIQUE,
                         license_number VARCHAR(50) NOT NULL UNIQUE,
                         availability VARCHAR(50) NOT NULL DEFAULT 'Доступен',
                         comment VARCHAR(1000)
);

CREATE TABLE trucks (
                        id VARCHAR(50) PRIMARY KEY,
                        make VARCHAR(100) NOT NULL,
                        model VARCHAR(100) NOT NULL,
                        year INT NOT NULL,
                        licensePlate VARCHAR(20) NOT NULL UNIQUE,
                        vinNumber VARCHAR(50) NOT NULL UNIQUE,
                        maintenanceStatus VARCHAR(50) NOT NULL DEFAULT 'Исправен',
                        comment VARCHAR(1000)
);

CREATE TABLE trailers (
                          id VARCHAR(50) PRIMARY KEY,
                          licensePlate VARCHAR(20) NOT NULL UNIQUE,
                          trailerType VARCHAR(100) NOT NULL,
                          length VARCHAR(20) NOT NULL,
                          width VARCHAR(20) NOT NULL,
                          height VARCHAR(20) NOT NULL,
                          volume VARCHAR(50) NOT NULL,
                          comment VARCHAR(1000)
);

CREATE TABLE manager_info (
                              managerName VARCHAR(255) PRIMARY KEY,
                              phone VARCHAR(20) NOT NULL,
                              email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE orders (
                        id VARCHAR(50) PRIMARY KEY,
                        shipperName VARCHAR(255) NOT NULL,
                        managerName VARCHAR(255) NOT NULL,
                        origin VARCHAR(500) NOT NULL,
                        destination VARCHAR(500) NOT NULL,
                        originLatitude VARCHAR(50),
                        originLongitude VARCHAR(50),
                        destinationLatitude VARCHAR(50),
                        destinationLongitude VARCHAR(50),
                        trailerType VARCHAR(100) NOT NULL,
                        volume VARCHAR(50) NOT NULL,
                        weight VARCHAR(50) NOT NULL,
                        pickupDate VARCHAR(10) NOT NULL,
                        pickupTime VARCHAR(5),
                        deliveryDate VARCHAR(10) NOT NULL,
                        deliveryTime VARCHAR(5),
                        transportationCost INT NOT NULL,
                        status VARCHAR(50) NOT NULL DEFAULT 'Ожидает',
                        cargoType VARCHAR(255) NOT NULL,
                        specialRequirements VARCHAR(1000),
                        length VARCHAR(20) NOT NULL,
                        width VARCHAR(20) NOT NULL,
                        height VARCHAR(20) NOT NULL,
                        assignedDriverId VARCHAR(50),
                        externalOrderNumber VARCHAR(100),
                        FOREIGN KEY (assignedDriverId) REFERENCES drivers(id),
                        FOREIGN KEY (managerName) REFERENCES manager_info(managerName)
);

CREATE TABLE fleet_assignments (
                                   id VARCHAR(50) PRIMARY KEY,
                                   driverId VARCHAR(50) NOT NULL,
                                   truckId VARCHAR(50) NOT NULL,
                                   trailerId VARCHAR(50) NOT NULL,
                                   assignedDate VARCHAR(10) NOT NULL,
                                   FOREIGN KEY (driverId) REFERENCES drivers(id),
                                   FOREIGN KEY (truckId) REFERENCES trucks(id),
                                   FOREIGN KEY (trailerId) REFERENCES trailers(id),
                                   UNIQUE (driverId, truckId, trailerId)
);

CREATE TABLE company_comments (
                                  companyName VARCHAR(255) PRIMARY KEY,
                                  comment VARCHAR(2000) NOT NULL
);

CREATE TABLE manager_comments (
                                  managerName VARCHAR(255) PRIMARY KEY,
                                  comment VARCHAR(2000) NOT NULL,
                                  FOREIGN KEY (managerName) REFERENCES manager_info(managerName)
);

CREATE TABLE order_comments (
                                orderId VARCHAR(50) PRIMARY KEY,
                                comment VARCHAR(2000) NOT NULL,
                                FOREIGN KEY (orderId) REFERENCES orders(id)
);

CREATE INDEX idx_orders_assigned_driver_delivery_date
    ON orders(assignedDriverId, deliveryDate, deliveryTime);

CREATE INDEX idx_orders_delivery_datetime
    ON orders(deliveryDate, deliveryTime);

CREATE INDEX idx_orders_driver_delivery_composite
    ON orders(assignedDriverId, deliveryDate DESC, deliveryTime DESC);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_pickup_date ON orders(pickupDate);
CREATE INDEX idx_orders_manager_name ON orders(managerName);
CREATE INDEX idx_orders_shipper_name ON orders(shipperName);

CREATE INDEX idx_drivers_availability ON drivers(availability);
CREATE INDEX idx_trucks_maintenance_status ON trucks(maintenanceStatus);
CREATE INDEX idx_fleet_assignments_driver ON fleet_assignments(driverId);
CREATE INDEX idx_fleet_assignments_truck ON fleet_assignments(truckId);
CREATE INDEX idx_fleet_assignments_trailer ON fleet_assignments(trailerId);

CREATE INDEX idx_orders_geo_origin ON orders(originLatitude, originLongitude);
CREATE INDEX idx_orders_geo_destination ON orders(destinationLatitude, destinationLongitude);

CREATE INDEX idx_orders_delivery_date_status ON orders(deliveryDate, status);
