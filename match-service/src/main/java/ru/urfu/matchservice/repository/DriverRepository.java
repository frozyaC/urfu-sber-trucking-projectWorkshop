package ru.urfu.matchservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.matchservice.models.Driver;
import ru.urfu.matchservice.models.DriverResponseDTO;

import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Integer> {

    Optional<Driver> findById(String id);
}
