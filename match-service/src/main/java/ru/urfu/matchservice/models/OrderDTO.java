package ru.urfu.matchservice.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

//TODO add foreign key to driver for check free transport on time
@Entity
@Table(name = "orders")
@Data
@JsonIgnoreProperties
public class OrderDTO {
    @Id
    private Integer id;
    private String shipperName;
    private String managerName;
    private String origin;
    private String destination;
    private String originLatitude;
    private String originLongitude;
    private String destinationLatitude;
    private String destinationLongitude;
    private String trailerType;
    private String volume;
    private String weight;
    private LocalDateTime pickupDate;
    private LocalDateTime pickupTime;
    private LocalDateTime deliveryDate;
    private LocalDateTime deliveryTime;
    private Double transportationCost;
    private String status;
    private String cargoType;
    private String specialRequirements;
    private String length;
    private String width;
    private String height;
    private Integer assignedDriverId;
    private String externalOrderNumber;
    @Column(name = "delivery_datetime")
    private LocalDateTime deliveryDateTime;
}
