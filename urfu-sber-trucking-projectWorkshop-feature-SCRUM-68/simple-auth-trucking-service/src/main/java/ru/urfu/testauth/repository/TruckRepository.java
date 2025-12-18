package ru.urfu.testauth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.testauth.models.Truck;

import java.util.Optional;

@Repository
public interface TruckRepository extends JpaRepository<Truck, String> {
    Optional<Truck> findByLicensePlate(String licensePlate);
    Optional<Truck> findByVinNumber(String vinNumber);
}


