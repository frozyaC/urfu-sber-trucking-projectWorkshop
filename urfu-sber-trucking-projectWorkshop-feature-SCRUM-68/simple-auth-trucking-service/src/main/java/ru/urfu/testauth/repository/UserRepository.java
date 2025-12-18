package ru.urfu.testauth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.testauth.models.User;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    User findByInnAndPassword(String inn, String password);
    User findByInn(String inn);
}
