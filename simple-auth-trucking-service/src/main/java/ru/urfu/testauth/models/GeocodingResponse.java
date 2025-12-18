package ru.urfu.testauth.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@JsonIgnoreProperties(ignoreUnknown = true)
public class GeocodingResponse {

    @Data
    public static class Geometry {
        private double lat;
        private double lng;
    }
}
