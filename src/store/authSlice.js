import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  isAuth: false,
  user: null,
  otp: {
    phone: "",
    hash: "",
    OTP:"",
  },
};

export const authSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      const { user } = action.payload;
      state.user = user;
      if (user === null) state.isAuth = false;
      else state.isAuth = true;
    },
    setOtp: (state, action) => {
      const { phone, hash,OTP } = action.payload;
      state.otp.phone = phone;
      state.otp.hash = hash;
      state.otp.OTP = OTP;
    },
  },
});
export const { setAuth, setOtp } = authSlice.actions;
export default authSlice.reducer;
