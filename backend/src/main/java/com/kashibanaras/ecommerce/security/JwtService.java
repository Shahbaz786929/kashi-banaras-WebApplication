package com.kashibanaras.ecommerce.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

@Service
public class JwtService {

 private final SecretKey key;
 private final long expiration;

 public JwtService(
         @Value("${app.jwt.secret}") String secret,
         @Value("${app.jwt.expiration-ms:86400000}") long expiration
 ) {

  if (secret == null || secret.length() < 32) {
   throw new IllegalArgumentException(
           "JWT_SECRET must be at least 32 characters"
   );
  }

  this.key = Keys.hmacShaKeyFor(
          secret.getBytes(StandardCharsets.UTF_8)
  );

  this.expiration = expiration;
 }

 public String generate(
         Long userId,
         String email,
         List<String> roles
 ) {

  return Jwts.builder()
          .subject(email)
          .claim("uid", userId)
          .claim("roles", roles)
          .issuedAt(new Date())
          .expiration(
                  new Date(
                          System.currentTimeMillis()
                                  + expiration
                  )
          )
          .signWith(key)
          .compact();
 }

 public Claims claims(String token) {

  return Jwts.parser()
          .verifyWith(key)
          .build()
          .parseSignedClaims(token)
          .getPayload();
 }

 public boolean valid(String token) {

  try {

   claims(token);

   return true;

  } catch (JwtException | IllegalArgumentException e) {

   return false;
  }
 }
}