package ru.urfu.matchservice.models;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;


/**
 * DTO для инициирования алгоритма расчета рекомендаций целевой машины для заказа.
 * Содержит время и координаты следующего заказа
 */
@Data
public class CoordinatesDateDTO {
    private LocalDateTime localDateTime;
    private BigDecimal longitute;
    private BigDecimal latitude;
}


