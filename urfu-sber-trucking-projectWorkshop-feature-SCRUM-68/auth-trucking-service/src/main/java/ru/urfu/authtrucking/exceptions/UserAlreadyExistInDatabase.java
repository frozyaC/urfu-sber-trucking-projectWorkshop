package ru.urfu.authtrucking.exceptions;

public class UserAlreadyExistInDatabase extends RuntimeException {
    public UserAlreadyExistInDatabase() {
        super();
    }

    public UserAlreadyExistInDatabase(String message) {
        super(message);
    }
}
