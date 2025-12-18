package ru.urfu.testauth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.urfu.testauth.models.Order;
import ru.urfu.testauth.repository.OrderRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;

    public Order createOrder(Order order) {
        return orderRepository.save(order);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }
}
