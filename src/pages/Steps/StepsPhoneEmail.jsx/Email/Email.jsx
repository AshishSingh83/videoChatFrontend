import React, { useState } from "react";
import { Card } from "../../../../components/shared/Card/Card";
import { Button } from "../../../../components/shared/Button/Button";
import TextInput from "../../../../components/shared/TextInput/TextInput";
import { useDispatch } from "react-redux";
import { sendOtp } from "../../../../http/index";
import { setOtp } from "../../../../store/authSlice";
import style from "../StepPhoneEmail.module.css";
const Email = ({ onNext }) => {
 // const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();
  async function sumbit() {
    //server request
    if(!email) return;
    try {
      const { data } = await sendOtp({
        // "phone":"+918357980532"
        phone: email,
      });
      dispatch(setOtp({ phone: data.phone, hash: data.hash , OTP:data.otp }));
      onNext();
    } catch (err) {
      console.log("error");
    }
  }
  return (
    <Card title="Enter your email id" icon="email2">
      <TextInput value={email} onChange={(e) => setEmail(e.target.value)} />
      <div>
        <div className={style.actionButtonWrap}>
          <Button onClick={sumbit} text="next"></Button>
        </div>
        <p className={style.buttomParagraph}>
          By entering your email, you’re agreeing to our Terms of Service and
          Privacy Policy. Thanks!
        </p>
      </div>
    </Card>
  );
};

export default Email;
