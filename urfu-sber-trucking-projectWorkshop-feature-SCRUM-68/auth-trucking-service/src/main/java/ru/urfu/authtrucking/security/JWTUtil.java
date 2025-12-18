//package ru.urfu.authtrucking.security;
//
//import com.auth0.jwt.JWT;
//import com.auth0.jwt.JWTVerifier;
//import com.auth0.jwt.algorithms.Algorithm;
//import com.auth0.jwt.interfaces.DecodedJWT;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.core.GrantedAuthority;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.stereotype.Component;
//
//import java.time.ZonedDateTime;
//import java.util.Date;
//import java.util.Set;
//import java.util.stream.Collectors;
//
//@Component
//public class JWTUtil {
//    private final String issuer = "cloud_filestorage";
//    @Value("${jwt_secret}")
//    private String secret;
//    private final String subject = "User details";
//    private final UserService userService;
//
//    public JWTUtil(UserService userService) {
//        this.userService = userService;
//    }
//
//    public String generateToken(SignInRequestDTO user){
//        Date expirateDate = Date.from(ZonedDateTime.now().plusMinutes(60).toInstant());
//
//        return JWT.create()
//                .withSubject(subject)
//                .withClaim("username", user.getUsername())
//                .withClaim("role", getRole())
//                .withIssuedAt(new Date())
//                .withIssuer(issuer)
//                .withExpiresAt(expirateDate)
//                .sign(Algorithm.HMAC256(secret));
//    }
//
//    private String getRole() {
//        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//
//        Set<String> roles = authentication.getAuthorities().stream()
//                .map(GrantedAuthority::getAuthority).collect(Collectors.toSet());
//        return roles.toString();
//    }
//
//    public DecodedJWT validateToken(String token){
//        JWTVerifier verifyingToken = JWT.require(Algorithm.HMAC256(secret))
//                .withSubject(subject)
//                .withIssuer(issuer)
//                .build();
//        return verifyingToken.verify(token);
//    }
//}
