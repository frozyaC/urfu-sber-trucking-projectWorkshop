package ru.urfu.matchservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.urfu.matchservice.models.DriverLegInfo;
import ru.urfu.matchservice.models.OrderDTO;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<OrderDTO, Integer> {
    @Query("select DISTINCT new ru.urfu.matchservice.models.DriverLegInfo(" +
            "o.assignedDriverId, " +
            "o.destinationLatitude, " +
            "o.destinationLongitude, " +
            "o.originLatitude, " +
            "o.originLongitude, " +
            "o.deliveryDateTime, " +
            "o.origin) " +
            "from OrderDTO o " +
            "where o.deliveryDateTime = (select max(o2.deliveryDateTime) from OrderDTO o2 where o2.assignedDriverId = o.assignedDriverId and o2.deliveryDateTime < :targetDateTime)")
    List<DriverLegInfo> findLastLegsBefore(@Param("targetDateTime") LocalDateTime targetDateTime);
}
