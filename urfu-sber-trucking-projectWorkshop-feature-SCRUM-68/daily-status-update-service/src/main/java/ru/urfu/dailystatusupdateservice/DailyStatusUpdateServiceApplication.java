package ru.urfu.dailystatusupdateservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DailyStatusUpdateServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(DailyStatusUpdateServiceApplication.class, args);
	}

}
