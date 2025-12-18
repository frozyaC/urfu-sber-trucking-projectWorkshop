package ru.urfu.testauth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.testauth.models.FleetAssignment;

import java.util.List;
import java.util.Optional;

@Repository
public interface FleetAssignmentRepository extends JpaRepository<FleetAssignment, String> {
    List<FleetAssignment> findByDriverId(String driverId);
    List<FleetAssignment> findByTruckId(String truckId);
    List<FleetAssignment> findByTrailerId(String trailerId);
    Optional<FleetAssignment> findByDriverIdAndTruckIdAndTrailerId(String driverId, String truckId, String trailerId);
}


