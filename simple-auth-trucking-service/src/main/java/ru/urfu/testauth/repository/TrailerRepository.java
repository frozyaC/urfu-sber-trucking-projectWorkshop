package ru.urfu.testauth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.testauth.models.Trailer;

import java.util.Optional;

@Repository
public interface TrailerRepository extends JpaRepository<Trailer, String> {
    Optional<Trailer> findByLicensePlate(String licensePlate);
}


