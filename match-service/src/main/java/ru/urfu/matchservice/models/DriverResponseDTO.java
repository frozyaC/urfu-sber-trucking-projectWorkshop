package ru.urfu.matchservice.models;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
public class DriverResponseDTO {
    @Id
    private String name;
    private String originLatitude;
    private String originLongitude;
    private LocalDateTime deliveryDate;
    private String origin;
}
