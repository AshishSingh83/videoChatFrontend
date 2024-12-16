import React, { useState } from "react";
import { Card } from "../../../../components/shared/Card/Card";
import { Button } from "../../../../components/shared/Button/Button";
import TextInput from "../../../../components/shared/TextInput/TextInput";
import style from "../StepPhoneEmail.module.css";
import { useDispatch } from "react-redux";
import { sendOtp } from "../../../../http/index";
import { setOtp } from "../../../../store/authSlice";
const Phone = ({ onNext }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const dispatch = useDispatch();
  async function sumbit() {
    //server request
    if(!phoneNumber) return;
    try {
      const { data } = await sendOtp({
        // "phone":"+918357980532"
        phone: phoneNumber,
      });
      dispatch(setOtp({ phone: data.phone, hash: data.hash,OTP:data.otp }));
      onNext();
    } catch (err) {
      console.log("error");
    }
  }
  return (
    <Card title="Enter any number" icon="phone">
      <TextInput
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      <div>
        <div className={style.actionButtonWrap}>
          <Button onClick={sumbit} text="next"></Button>
        </div>
        <p className={style.buttomParagraph}>
          By entering your number, you’re agreeing to our Terms of Service and
          Privacy Policy. Thanks!
        </p>
      </div>
    </Card>
  );
};
export default Phone;
