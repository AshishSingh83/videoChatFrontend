// import React, { useState } from "react";
// import { Button } from "../../../components/shared/Button/Button";
// import styles from "./StepAvatar.module.css";
// import { useSelector, useDispatch } from "react-redux";
// import { setAvatar } from "../../../store/activateSlice";
// import { activate } from "../../../http";
// import { setAuth } from "../../../store/authSlice";
// import { Card } from "../../../components/shared/Card/Card";
// import Loader from "../../../components/shared/Loader/Loader";
// const StepAvatar = ({ onNext }) => {
//   const dispatch = useDispatch();
//   const { name, avatar } = useSelector((state) => state.activate);
//   const [image, setImage] = useState("/images/monkey-avatar.png");
//   const [loading, setLoading] = useState(false);
//   function captureImage(e) {
//     const file = e.target.files[0];
//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onloadend = function () {
//       setImage(reader.result);
//       dispatch(setAvatar(reader.result));
//     };
//   }
//   async function submit() {
//     console.log('here');
//     setLoading(true);
//     try {
//       if(!avatar) dispatch(setAvatar(image));
//       console.log(avatar);
//       const { data } = await activate({ name, avatar });
//       if (data.auth) {
//         dispatch(setAuth(data));
//       }
//     } catch (err) {
//       console.log(err);
//     } finally {
//       setLoading(false);
//     }
//   }
//   if (loading) return <Loader message="Activation in progress ..." />;
//   return (
//     <>
//       <Card title={`Okay, ${name}`} icon="monkey-emoji">
//         <p className={styles.subHeading}>How’s this photo?</p>
//         <div className={styles.avatarWrapper}>
//           <img className={styles.avatarImage} src={image} alt="avatar" />
//         </div>
//         <div>
//           <input
//             onChange={captureImage}
//             id="avatarInput"
//             type="file"
//             className={styles.avatarInput}
//           />
//           <label className={styles.avatarLabel} htmlFor="avatarInput">
//             Choose a different photo
//           </label>
//         </div>
//         <div>
//           <Button onClick={submit} text="Next" />
//         </div>
//       </Card>
//     </>
//   );
// };
// export default StepAvatar;
import React, { useState, useEffect } from "react";
import { Button } from "../../../components/shared/Button/Button";
import styles from "./StepAvatar.module.css";
import { useSelector, useDispatch } from "react-redux";
import { setAvatar } from "../../../store/activateSlice";
import { activate } from "../../../http";
import { setAuth } from "../../../store/authSlice";
import { Card } from "../../../components/shared/Card/Card";
import Loader from "../../../components/shared/Loader/Loader";

const StepAvatar = ({ onNext }) => {
  const dispatch = useDispatch();
  const refreshToken = localStorage.getItem('refreshToken');
  const accessToken = localStorage.getItem('accessToken');
  const { name, avatar } = useSelector((state) => state.activate);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate loading the default avatar as a file
    const defaultAvatarPath = "/images/monkey-avatar.png";
    fetch(defaultAvatarPath)
      .then((res) => res.blob())
      .then((blob) => {
        const defaultFile = new File([blob], "default-avatar.png", {
          type: "image/png",
        });
        processFile(defaultFile);
      });
  }, []);

  const processFile = (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function () {
      const base64Image = reader.result;
      setImage(base64Image);
      dispatch(setAvatar(base64Image));
    };
  };

  function captureImage(e) {
    const file = e.target.files[0];
    processFile(file);
  }

  async function submit() {
    setLoading(true);
    try {
      const { data } = await activate({ name, avatar,refreshToken,accessToken });
      if (data.auth) {
        dispatch(setAuth(data));
      }
    } catch (err) {
      console.error("Activation error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loader message="Activation in progress ..." />;

  return (
    <>
      <Card title={`Okay, ${name}`} icon="monkey-emoji">
        <p className={styles.subHeading}>How’s this photo?</p>
        <div className={styles.avatarWrapper}>
          <img className={styles.avatarImage} src={image} alt="avatar" />
        </div>
        <div>
          <input
            onChange={captureImage}
            id="avatarInput"
            type="file"
            className={styles.avatarInput}
          />
          <label className={styles.avatarLabel} htmlFor="avatarInput">
            Choose a different photo
          </label>
        </div>
        <div>
          <Button onClick={submit} text="Next" />
        </div>
      </Card>
    </>
  );
};

export default StepAvatar;
