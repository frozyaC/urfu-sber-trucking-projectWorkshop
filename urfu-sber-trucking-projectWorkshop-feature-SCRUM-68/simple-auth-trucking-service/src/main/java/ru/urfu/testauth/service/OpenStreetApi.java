package ru.urfu.testauth.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import ru.urfu.testauth.models.GeocodingResponse;

@Service
@RequiredArgsConstructor
public class OpenStreetApi {
    private static final Logger log = LoggerFactory.getLogger(OpenStreetApi.class);
    @Value("${API_KEY}")
    private String API_KEY;
    private final String BASE_URL = "https://api.opencagedata.com/geocode/v1/json";
    private final RestTemplate restTemplate;


    public GeocodingResponse getCoordinates(String address) {
        String url = buildUrl(address);
        log.info("URL: {}", url);
        ResponseEntity<GeocodingResponse> response = restTemplate.getForEntity(
                url, GeocodingResponse.class);

        return response.getBody();
    }

    private String buildUrl(String address) {
        return UriComponentsBuilder.fromHttpUrl(BASE_URL)
                .queryParam("q", address)
                .queryParam("key", API_KEY)
                .queryParam("language", "ru")
                .queryParam("countrycode", "ru")
                .build(false)
                .toUriString();
    }

}
