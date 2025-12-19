package ru.urfu.testauth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.testauth.models.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {}
