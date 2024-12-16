// import { useState, useEffect } from "react";
// import axios from "axios";
// import { useDispatch } from "react-redux";
// import { setAuth } from "../store/authSlice";
// export function useLoadingWithRefresh() {
//   const [loading, setLoading] = useState(true);
//   const dispatch = useDispatch();
//   useEffect(() => {
//     (async () => {
//       try {
//         const { data } = await axios.get(
//           `${process.env.REACT_APP_API_URL}/api/refresh`,
//           {
//             withCredentials: true,
//           }
//         );
//         dispatch(setAuth(data));
//         setLoading(false);
//       } catch (err) {
//         console.log(err);
//         setLoading(false);
//       }
//     })();
//   }, []);
//   return { loading };
// }
import { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setAuth } from "../store/authSlice";
import api from "../http";
export function useLoadingWithRefresh() {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchData = async () => {
      try {
        // const { data } = await axios.get(
        //   `${process.env.REACT_APP_API_URL}/api/refresh`,
        //   {
        //     withCredentials: true,
        //   }
        // );
        const accessToken= localStorage.getItem('accessToken');
        const refreshToken= localStorage.getItem('refreshToken');
        const {data}  = await api.post('/api/refresh',{
          accessToken,refreshToken
        });
        //console.log('le data',data);
        localStorage.setItem("accessToken",data.accessToken);
        localStorage.setItem("refreshToken",data.refreshToken);
        dispatch(setAuth(data));
      } catch (err) {
        console.error("Error during token refresh:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  return { loading };
}
