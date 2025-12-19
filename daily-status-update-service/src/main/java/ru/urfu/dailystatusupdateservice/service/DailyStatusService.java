package ru.urfu.dailystatusupdateservice.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import ru.urfu.dailystatusupdateservice.models.ArrivalDTO;
import ru.urfu.dailystatusupdateservice.models.Order;
import ru.urfu.dailystatusupdateservice.repository.DailyStatusRepository;

import java.util.List;
import java.util.Map;

@Service
public class DailyStatusService {

    private static final String BASE_URL = "http://localhost:8090/api/drivers/DRIVER/check-arrival";
    private static final Logger log = LoggerFactory.getLogger(DailyStatusService.class);

    private final RestTemplate restTemplate;
    private final DailyStatusRepository dailyStatusRepository;

    public DailyStatusService(RestTemplate restTemplate, DailyStatusRepository dailyStatusRepository) {
        this.restTemplate = restTemplate;
        this.dailyStatusRepository = dailyStatusRepository;
    }

    @Scheduled(fixedDelay = 300000)
    public void updateStatus() {
        List<Order> orders = dailyStatusRepository.findAll();
        for(Order order : orders){
            ArrivalDTO response = restTemplate.postForObject(
                    BASE_URL,
                    Map.of(),
                    ArrivalDTO.class,
                    order.getAssignedDriverId()
            );
            log.info("Запрос к датчику на URL: {}", BASE_URL);
            log.info("Ответ от датчика: {}", response.toString());

            order.setStatus("Завершён");
            dailyStatusRepository.save(order);
        }
    }
}
