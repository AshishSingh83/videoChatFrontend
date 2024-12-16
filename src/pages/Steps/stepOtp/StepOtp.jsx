import React, {  useState } from "react";
import styles from "./stepOtp.module.css";
import { Card } from "../../../components/shared/Card/Card";
import TextInput from "../../../components/shared/TextInput/TextInput";
import { Button } from "../../../components/shared/Button/Button";
import { verifyOtp } from "../../../http";
import { useDispatch, useSelector } from "react-redux";
import { setAuth } from "../../../store/authSlice";
export const StepOtp = () => {
  const dispatch = useDispatch();
  const { phone, hash,OTP } = useSelector((state) => state.auth.otp);
  const [otp, setOtp] = useState(OTP);
  async function submit() {
    try {
      const { data } = await verifyOtp({ otp, phone, hash });
      localStorage.setItem('accessToken',data.accessToken);
      localStorage.setItem('refreshToken',data.refreshToken);
      dispatch(setAuth(data));
    } catch (err) {
      console.log(err);
    }
  }
  return (
    <>
      <div className={styles.cardWrapper}>
        <Card title="Enter the code we just texted you" icon="lock">
          <TextInput value={otp} onChange={(e) => setOtp(e.target.value)} />
          <div>
            <div className={styles.actionButtonWrap}>
              <Button onClick={submit} text="Next"></Button>
            </div>
            <p className={styles.buttomParagraph}>
              By entering your number, you’re agreeing to our Terms of Service
              and Privacy Policy. Thanks!
            </p>
          </div>
        </Card>
      </div>
    </>
  );
};
