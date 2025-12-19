package ru.urfu.testauth.models;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.Map;

@Data
public class PassDTO {

    @NotEmpty(message = "Номер пропуска не может быть пустым")
    private String passNumber;

    @NotEmpty(message = "ID заказа не может быть пустым")
    private String orderId;

    @NotEmpty(message = "Дата выдачи не может быть пустой")
    private String issueDate;

    @NotEmpty(message = "Дата окончания действия не может быть пустой")
    private String validUntil;

    @NotEmpty(message = "Цель поездки не может быть пустой")
    private String purpose;

    private String routeDescription;
    private String additionalNotes;

    @Email(message = "Email должен быть корректным")
    @NotEmpty(message = "Email не может быть пустым")
    private String email;

    // Данные заказа
    private Map<String, Object> order;

    // Данные водителя
    private Map<String, Object> driver;
    private String driverId;

    // Данные транспортного средства
    private Map<String, Object> truck;
    private String truckId;

    // Паспортные данные
    private Map<String, Object> passportData;
}

