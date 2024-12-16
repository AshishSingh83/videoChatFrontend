import React, { useState } from "react";
import { StepPhoneEmail } from "../Steps/StepsPhoneEmail.jsx/StepPhoneEmail";
import { StepOtp } from "../Steps/stepOtp/StepOtp";
const Steps = {
  1: StepPhoneEmail,
  2: StepOtp,
};
export const Authenticate = () => {
  const [step, setStep] = useState(1);
  function onNext(){
    setStep(step + 1);
  }
  const Step = Steps[step];
  return (
    <div>
      <Step onNext={onNext} />
    </div>
  );
};
