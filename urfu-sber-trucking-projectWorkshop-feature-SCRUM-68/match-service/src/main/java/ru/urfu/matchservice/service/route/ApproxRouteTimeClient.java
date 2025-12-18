package ru.urfu.matchservice.service.route;

import org.springframework.stereotype.Component;
import ru.urfu.matchservice.utils.GeoUtils;

@Component
public class ApproxRouteTimeClient implements RouteTimeClient {
    private static final double AVERAGE_SPEED_KMH = 60.0;

    @Override
    public long getTravelTimeSeconds(double fromLat, double fromLon, double toLat, double toLon) {
        double km = GeoUtils.haversineKm(fromLat, fromLon, toLat, toLon);
        double hours = km / AVERAGE_SPEED_KMH;
        return Math.round(hours * 3600.0);
    }
}


