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
@Table(name = "drivers")
public class Driver {
    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "phone", nullable = false)
    private String phone;

    @Column(name = "licenseNumber", nullable = false, unique = true)
    private String licenseNumber;

    @Column(name = "availability", nullable = false)
    private String availability = "Доступен";

    @Column(name = "comment", length = 1000)
    private String comment;
}


