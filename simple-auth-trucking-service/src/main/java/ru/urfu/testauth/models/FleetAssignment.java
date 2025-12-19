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
@Table(name = "fleet_assignments")
public class FleetAssignment {
    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "driverId", nullable = false)
    private String driverId;

    @Column(name = "truckId", nullable = false)
    private String truckId;

    @Column(name = "trailerId", nullable = false)
    private String trailerId;

    @Column(name = "assignedDate", nullable = false)
    private String assignedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driverId", insertable = false, updatable = false)
    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "truckId", insertable = false, updatable = false)
    private Truck truck;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trailerId", insertable = false, updatable = false)
    private Trailer trailer;
}


