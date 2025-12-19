package ru.urfu.testauth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.urfu.testauth.models.User;
import ru.urfu.testauth.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    public User login(String inn, String password) {
        return userRepository.findByInnAndPassword(inn, password);
    }

    public User register(User user) throws Exception {
        if (userRepository.findByInn(user.getInn()) != null) {
            throw new Exception("Пользователь с этим ИНН уже существует");
        }
        return userRepository.save(user);
    }

    public List<User> getAllUsers(){
        return userRepository.findAll();
    }
}
