package ru.urfu.dailystatusupdateservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.dailystatusupdateservice.models.Order;

import java.util.List;

@Repository
public interface DailyStatusRepository extends JpaRepository<Order, Long> {

}
