package ru.urfu.authtrucking.controller;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import ru.urfu.authtrucking.dto.PassDTO;
import ru.urfu.authtrucking.service.PassService;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api")
@Slf4j
public class PassController {

    private final PassService passService;

    @Autowired
    public PassController(PassService passService) {
        this.passService = passService;
    }

    @PostMapping("/pass")
    public ResponseEntity<?> createPass(@Valid @RequestBody PassDTO passDTO,
                                       BindingResult bindingResult) {
        log.info("Received pass creation request for order: {}", passDTO.getOrderId());
        
        if (bindingResult.hasErrors()) {
            StringBuilder sb = new StringBuilder();
            List<FieldError> fieldErrors = bindingResult.getFieldErrors();
            for (FieldError fieldError : fieldErrors) {
                sb.append(fieldError.getField()).append(" - ").append(fieldError.getDefaultMessage()).append(". ");
            }
            return ResponseEntity.badRequest().body(sb.toString());
        }

        try {
            // Генерация PDF
            byte[] pdfBytes = passService.generatePassPdf(passDTO);
            
            // Отправка на email
            passService.sendPassByEmail(passDTO, pdfBytes);
            
            log.info("Pass created and sent successfully to: {}", passDTO.getEmail());
            return ResponseEntity.ok().body("Пропуск успешно создан и отправлен на email: " + passDTO.getEmail());
        } catch (IOException e) {
            log.error("Error generating PDF: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ошибка при генерации PDF: " + e.getMessage());
        } catch (jakarta.mail.MessagingException e) {
            log.error("Error sending email: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ошибка при отправке email: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Произошла ошибка: " + e.getMessage());
        }
    }
}




