package ru.urfu.authtrucking.dto;

import lombok.Data;

@Data
public class AuthResponseDTO {
    private String username;

    public AuthResponseDTO(String username) {
        this.username = username;
    }
}
