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
@Table(name = "trailers")
public class Trailer {
    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "licensePlate", nullable = false, unique = true)
    private String licensePlate;

    @Column(name = "trailerType", nullable = false)
    private String trailerType;

    @Column(name = "length", nullable = false)
    private String length;

    @Column(name = "width", nullable = false)
    private String width;

    @Column(name = "height", nullable = false)
    private String height;

    @Column(name = "volume", nullable = false)
    private String volume;

    @Column(name = "comment", length = 1000)
    private String comment;
}


