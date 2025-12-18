package ru.urfu.dailystatusupdateservice.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ArrivalDTO {
    @JsonProperty("driverId")
    private String driverId;

    @JsonProperty("orderId")
    private String orderId;

    @JsonProperty("destinationLatitude")
    private double destinationLatitude;

    @JsonProperty("destinationLongitude")
    private double destinationLongitude;

    @Override
    public String toString() {
        return "ArrivalDTO{" +
                "driverId='" + driverId + '\'' +
                ", orderId='" + orderId + '\'' +
                ", destinationLatitude=" + destinationLatitude +
                ", destinationLongitude=" + destinationLongitude +
                '}';
    }
}
