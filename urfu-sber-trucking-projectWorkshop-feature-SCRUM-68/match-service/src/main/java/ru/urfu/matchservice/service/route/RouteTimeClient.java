package ru.urfu.matchservice.service.route;

public interface RouteTimeClient {
    /**
     * Returns travel time in seconds between two coordinates.
     */
    long getTravelTimeSeconds(double fromLat, double fromLon, double toLat, double toLon);
}


