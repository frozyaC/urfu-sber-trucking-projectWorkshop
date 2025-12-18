package ru.urfu.dailystatusupdateservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.urfu.dailystatusupdateservice.service.DailyStatusService;

@RestController
@RequestMapping("/api/status")
@CrossOrigin(origins = {
        "http://localhost:3003",
        "http://localhost:3001"
}, maxAge = 3600)
public class DailyStatusController {
    private final DailyStatusService dailyStatusService;

    public DailyStatusController(DailyStatusService dailyStatusService) {
        this.dailyStatusService = dailyStatusService;
    }

    @GetMapping
    public ResponseEntity<?> updateStatus(){
        dailyStatusService.updateStatus();
        return ResponseEntity.ok(HttpStatus.OK);
    }
}
