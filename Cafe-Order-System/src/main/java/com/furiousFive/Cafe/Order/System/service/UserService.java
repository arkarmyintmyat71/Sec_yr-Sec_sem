package com.furiousFive.Cafe.Order.System.service;

import com.furiousFive.Cafe.Order.System.dto.request.LoginReqDto;
import com.furiousFive.Cafe.Order.System.dto.request.RegisterReqDto;
import com.furiousFive.Cafe.Order.System.model.User;

public interface UserService {
    User userRegistration(RegisterReqDto registerReqDto);
    User login(LoginReqDto dto);
}
