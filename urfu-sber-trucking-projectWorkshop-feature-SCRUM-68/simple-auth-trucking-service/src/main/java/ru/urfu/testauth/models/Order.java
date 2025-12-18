package ru.urfu.testauth.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String shipperName;
    private String managerName;
    private String origin;
    private String destination;
    private Double originLatitude;
    private Double originLongitude;
    private Double destinationLatitude;
    private Double destinationLongitude;
    private String trailerType;
    private Double volume;
    private Double weight;
    private LocalDate pickupDate;
    private LocalTime pickupTime;
    private LocalDate deliveryDate;
    private LocalTime deliveryTime;
    private String cargoType;
    private String specialRequirements;
    private Double transportationCost;
    private Double length;
    private Double width;
    private Double height;
    private Integer vehicleCount;
    private String externalOrderNumber;
    private String status;
    private Long assignedDriverId;

}
