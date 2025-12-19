package ru.urfu.testauth.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "trucks")
public class Truck {
    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "make", nullable = false)
    private String make;

    @Column(name = "model", nullable = false)
    private String model;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "licensePlate", nullable = false, unique = true)
    private String licensePlate;

    @Column(name = "vinNumber", nullable = false, unique = true)
    private String vinNumber;

    @Column(name = "maintenanceStatus", nullable = false)
    private String maintenanceStatus = "Исправен";

//    @Column(name = "currentLocation", nullable = false)
//    private String currentLocation;

    @Column(name = "comment", length = 1000)
    private String comment;
}


