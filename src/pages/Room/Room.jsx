// import React, {
//   useState,
//   useEffect,
//   useRef,
//   useCallback,
//   useReducer,
// } from "react";
// import { useSelector } from "react-redux";
// import { useParams, useNavigate } from "react-router-dom";
// import { getRoom } from "../../http";
// import styles from "./Room.module.css";
// import { ACTIONS } from "../../actions";
// import socketInit from "../../socket";
// import freeice from "freeice";

// const Room = () => {
//   const user = useSelector((state) => state.auth.user);
//   const { id: roomId } = useParams();
//   const history = useNavigate();

//   const [room, setRoom] = useState(null);
//   const [isMuted, setMuted] = useState(true);
//   const [isVideo, setVideo] = useState(false);

//   const audioElements = useRef({});
//   const muteStateRef = useRef({});
//   const videoStateRef = useRef({});
//   const videoElements = useRef({});
//   const connections = useRef({});
//   const socket = useRef(null);
//   const localMediaStream = useRef(null);
//   const clientReducer = (state, action) => {
//     switch (action.type) {
//       case "ADD_CLIENT":
//         const existingClient = state.find((client) => client.id === action.payload.id);
//         if (existingClient) {
//           // Update existing client
//           return state.map((client) =>
//             client.id === action.payload.id ? { ...client, ...action.payload } : client
//           );
//         }
//         // Add new client
//         return [...state, action.payload];
//       case "REMOVE_CLIENT":
//         return state.filter((client) => client.id !== action.payload);
//       default:
//         return state;
//     }
//   };

//   const [clients, dispatchClients] = useReducer(clientReducer, []);

//   useEffect(() => {
//     const fetchRoom = async () => {
//       try {
//         const accessToken = localStorage.getItem("accessToken");
//         const { data } = await getRoom({ roomId, accessToken });
//         setRoom(data);
//       } catch (err) {
//         console.error("Error fetching room details", err);
//       }
//     };
//     fetchRoom();
//   }, [roomId]);

//   useEffect(() => {
//     muteStateRef.current.muteInfo=isMuted;
//     handleMute(isMuted, user.id);
//   }, [isMuted]);
//   useEffect(() => {
//     videoStateRef.current.muteInfo=isMuted;
//     handleVideo(isVideo, user.id);
//   }, [isVideo]);
//   const provideRef = (ref, userId, callback) => {
//     if (ref.current[userId]) {
//       callback(ref.current[userId]);
//     } else {
//       const interval = setInterval(() => {
//         if (ref.current[userId]) {
//           callback(ref.current[userId]);
//           clearInterval(interval);
//         }
//       }, 100);
//     }
//   };
//   const handleMuteClick = (clientId) => {
//     if (clientId !== user.id) {
//       return;
//     }
//     setMuted((prev) => !prev);
//     dispatchClients({
//       type: "ADD_CLIENT",
//       payload: { id: clientId, muted: !isMuted }, // Update client state
//     });
//   };
//   const handleVideoClick = (clientId) => {
//     if (clientId !== user.id) {
//       return;
//     }
//     setVideo((prev) => !prev);
//     dispatchClients({
//       type: "ADD_CLIENT",
//       payload: { id: clientId, video:!isVideo }, // Update client state
//     });
//   };
//   const addNewClient = useCallback((newClient, cb) => {
//     dispatchClients({ type: "ADD_CLIENT", payload: newClient });
//     if (cb) cb();
//   }, []);

//   useEffect(()=>{
//     const initChat = async () => {
//       try {
//         socket.current = socketInit();
//         localMediaStream.current = await navigator.mediaDevices.getUserMedia({
//           audio: true,
//           video: true,
//         });
//         localMediaStream.current.getAudioTracks().forEach((track) => {
//           track.enabled = false;
//         });
//         localMediaStream.current.getVideoTracks().forEach((track) => {
//           track.enabled = false;
//         });
//         addNewClient({ ...user, muted: true,video:false }, () => {
//           provideRef(audioElements, user.id, (element) => {
//             element.volume = 0;
//             element.srcObject = localMediaStream.current;
//           });

//           provideRef(videoElements, user.id, (element) => {
//             element.srcObject = localMediaStream.current;
//           });
//         });

//         socket.current.on(ACTIONS.ADD_PEER, handleNewPeer);
//         socket.current.on(ACTIONS.REMOVE_PEER, handleRemovePeer);
//         socket.current.on(ACTIONS.ICE_CANDIDATE, handleIceCandidate);
//         socket.current.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);
//         socket.current.on(ACTIONS.MUTE, ({ userId }) =>
//           handleSetMute(true, userId)
//         );
//         socket.current.on(ACTIONS.UNMUTE, ({ userId }) =>
//           handleSetMute(false, userId)
//         );
//         socket.current.on(ACTIONS.VIDEO_ON, ({ userId }) =>
//           handleSetVideo(true, userId)
//         );
//         socket.current.on(ACTIONS.VIDEO_OFF, ({ userId }) =>
//           handleSetVideo(false, userId)
//         );
//         socket.current.on('mute_state', ({mute_info,userAbout,video_info }) =>
//         dispatchClients({
//           type: "ADD_CLIENT",
//           payload: { id: userAbout.id, muted: mute_info,video:!video_info },
//         })
//         );

//         socket.current.emit(ACTIONS.JOIN, { roomId, user });
//       } catch (err) {
//         console.error("Error initializing chat", err);
//       }
//     };

//     const handleNewPeer = async ({ peerId, createOffer, user: remoteUser }) => {
//      // console.log('dekh',muteStateRef.current);
//       if (connections.current[peerId]) {
//         console.warn(`Already connected with ${peerId}`);
//         return;
//       }

//       addNewClient({ ...remoteUser, muted: true });

//       connections.current[peerId] = new RTCPeerConnection({
//         iceServers: freeice(),
//       });

//       connections.current[peerId].onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.current.emit(ACTIONS.RELAY_ICE, {
//             peerId,
//             icecandidate: event.candidate,
//           });
//         }
//       };
//       connections.current[peerId].ontrack = ({ streams: [remoteStream] }) => {
//         remoteStream.getTracks().forEach((track) => {
//           if (track.kind === "audio") {
//             provideRef(audioElements, remoteUser.id, (element) => {
//               element.srcObject = remoteStream;
//             });
//           } else if (track.kind === "video") {
//             provideRef(videoElements, remoteUser.id, (element) => {
//               element.srcObject = remoteStream;
//             });
//           }
//         });
//       };

//       localMediaStream.current.getTracks().forEach((track) => {
//         connections.current[peerId].addTrack(track, localMediaStream.current);
//       });

//       if (createOffer) {
//         const offer = await connections.current[peerId].createOffer();
//         await connections.current[peerId].setLocalDescription(offer);
//         socket.current.emit(ACTIONS.RELAY_SDP, {
//           peerId,
//           sessionDescription: offer,
//         });
//       }
//       socket.current.emit('mute_state',{
//         peerId,'mute_info':muteStateRef.current.muteInfo,'userAbout':user,'video_info':videoStateRef.current.muteInfo,
//       })
//     };

//     const handleRemovePeer = ({ peerId, userId }) => {
//       if (connections.current[peerId]) {
//         connections.current[peerId].close();
//         delete connections.current[peerId];
//       }

//       dispatchClients({ type: "REMOVE_CLIENT", payload: userId });
//     };

//     const handleIceCandidate = ({ peerId, icecandidate }) => {
//       if (connections.current[peerId]) {
//         connections.current[peerId].addIceCandidate(icecandidate);
//       }
//     };

//     const setRemoteMedia = async ({
//       peerId,
//       sessionDescription: remoteSessionDescription,
//     }) => {
//       const connection = connections.current[peerId];
//       await connection.setRemoteDescription(
//         new RTCSessionDescription(remoteSessionDescription)
//       );

//       if (remoteSessionDescription.type === "offer") {
//         const answer = await connection.createAnswer();
//         await connection.setLocalDescription(answer);
//         socket.current.emit(ACTIONS.RELAY_SDP, {
//           peerId,
//           sessionDescription: answer,
//         });
//       }
//     };

//     const handleSetMute = (mute, userId) => {
//       dispatchClients({
//         type: "ADD_CLIENT",
//         payload: { id: userId, muted: mute },
//       });

//       if (userId === user.id) {
//         setMuted(mute);
//         // Update the local audio stream
//         if (localMediaStream.current) {
//           const audioTracks = localMediaStream.current.getAudioTracks();
//           if (audioTracks.length > 0) {
//             audioTracks[0].enabled = !mute; // Enable or disable the audio track
//           }
//         }
//         // Update the audio element for the local user
//         // if (audioElements.current[userId]) {
//         //   audioElements.current[userId].muted = mute; // Sync the audio element state
//         // }
//       }
//     };
//     const handleSetVideo = (videoState, userId) => {
//       dispatchClients({
//         type: "ADD_CLIENT",
//         payload: { id: userId, video: videoState },
//       });
//       if (userId === user.id) {
//         setVideo(videoState);
//         // Update the local audio stream
//         if (localMediaStream.current) {
//           const videoTracks = localMediaStream.current.getVideoTracks();
//           if (videoTracks.length > 0) {
//             videoTracks[0].enabled = videoState; // Enable or disable the audio track
//           }
//         }
//         // Update the audio element for the local user
//         // if (audioElements.current[userId]) {
//         //   audioElements.current[userId].muted = mute; // Sync the audio element state
//         // }
//       }
//     };

//     initChat();

//     return () => {
//       if (socket.current) {
//         socket.current.disconnect();
//         socket.current = null;
//       }

//       if (localMediaStream.current) {
//         localMediaStream.current.getTracks().forEach((track) => track.stop());
//       }
//     };
//   }, [roomId, user]);

//   const handleMute = (isMute, userId) => {
//     if (userId === user.id && localMediaStream.current) {
//       localMediaStream.current.getTracks()[0].enabled = !isMute;
//       if (isMute) {
//         socket.current.emit(ACTIONS.MUTE, {
//           roomId,
//           userId: user.id,
//         });
//       } else {
//         socket.current.emit(ACTIONS.UNMUTE, {
//           roomId,
//           userId: user.id,
//         });
//       }
//     }
//   };
//   const handleVideo = (videoState, userId) => {
//     if (userId === user.id && localMediaStream.current) {
//       localMediaStream.current.getVideoTracks()[0].enabled = videoState;
//       if (videoState) {
//         socket.current.emit(ACTIONS.VIDEO_ON, {
//           roomId,
//           userId: user.id,
//         });
//       } else {
//         socket.current.emit(ACTIONS.VIDEO_OFF, {
//           roomId,
//           userId: user.id,
//         });
//       }
//     }
//   };

//   const handManualLeave = () => {
//     history("/rooms");
//   };
//   return (
//     <div>
//       <div className="container">
//         <button onClick={handManualLeave} className={styles.goBack}>
//           <img src="/images/arrow-left.png" alt="arrow-left" />
//           <span>All voice rooms</span>
//         </button>
//       </div>
//       <div className={styles.clientsWrap}>
//         <div className={styles.header}>
//           {room && <h2 className={styles.topic}>{room.topic}</h2>}
//           <div className={styles.actions}>
//             <button className={styles.actionBtn}>
//               <img src="/images/palm.png" alt="palm-icon" />
//             </button>
//             <button onClick={handManualLeave} className={styles.actionBtn}>
//               <img src="/images/win.png" alt="win-icon" />
//               <span>Leave quietly</span>
//             </button>
//           </div>
//         </div>
//         <div className={styles.clientsList}>
//           {clients.map((client) => (
//             <div className={styles.client} key={client.id}>
//               <div className={styles.userHead}>
//                 <img className={styles.userAvatar} src={client.avatar} alt="" />
//                 <audio
//                   autoPlay
//                   ref={(instance) => {
//                     if (instance) {
//                       audioElements.current[client.id] = instance;
//                     }
//                   }}
//                 />
//                 <video
//                   autoPlay
//                   muted
//                   style={{ width: "100px", height: "100px" }}
//                   ref={(instance) => {
//                     if (instance) {
//                       videoElements.current[client.id] = instance;
//                     }
//                   }}
//                 />
//                 <button
//                   onClick={() => handleMuteClick(client.id)}
//                   className={styles.micBtn}
//                 >
//                   {client.muted ? (
//                     <img
//                       className={styles.mic}
//                       src="/images/mic-mute.png"
//                       alt="mic"
//                     />
//                   ) : (
//                     <img
//                       className={styles.micImg}
//                       src="/images/mic.png"
//                       alt="mic"
//                     />
//                   )}
//                 </button>
//                 <button
//                   onClick={() => handleVideoClick(client.id)}
//                   className={styles.videoBtn}
//                 >
//                   {client.video ?  <img
//                       className={styles.mic}
//                       src="/no-video.png"
//                       alt="mic"
//                     /> :
//                      <img
//                       className={styles.videoOn}
//                       src="/videoOn3.png"
//                       alt="mic"
//                     />
//                     }
//                 </button>
//               </div>
//               <h4>{client.name}</h4>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };
// export default Room;

// import React, {
//   useState,
//   useEffect,
//   useRef,
//   useCallback,
//   useReducer,
// } from "react";
// import { useSelector } from "react-redux";
// import { useParams, useNavigate } from "react-router-dom";
// import { getRoom } from "../../http";
// import styles from "./Room.module.css";
// import { ACTIONS } from "../../actions";
// import socketInit from "../../socket";
// import freeice from "freeice";

// const Room = () => {
//   const user = useSelector((state) => state.auth.user);
//   const { id: roomId } = useParams();
//   const history = useNavigate();

//   const [room, setRoom] = useState(null);
//   const [isMuted, setMuted] = useState(true);
//   const [isVideo, setVideo] = useState(false);
//   const [screenSharer, setScreenSharer] = useState(null);
//   const screenShareStream = useRef(null);

//   const audioElements = useRef({});

//   const muteStateRef = useRef({});
//   const videoStateRef = useRef({});

//   const videoElements = useRef({});
//   const connections = useRef({});
//   const socket = useRef(null);
//   const localMediaStream = useRef(null);
//   const handleScreenShare = async (clientId) => {
//     if (clientId !== user.id) return;
//     // Stop existing screen share
//     if (screenSharer === user.id){
//       setScreenSharer(null);
//       if (screenShareStream.current){
//         screenShareStream.current.getTracks().forEach((track) => track.stop());
//         screenShareStream.current = null;
//         socket.current.emit(ACTIONS.STOP_SCREEN_SHARE, {
//           roomId,
//           userId: user.id,
//         });
//       }
//       return;
//     }
//     try {
//       const stream = await navigator.mediaDevices.getDisplayMedia({
//         video: true,
//       });
//       screenShareStream.current = stream;
//       setScreenSharer(user.id);

//       // Add screen share stream to peer connections
//       Object.values(connections.current).forEach((connection) => {
//         screenShareStream.current.getTracks().forEach((track) =>{
//           console.log('a');
//           console.log(track.type);
//           console.log(track);
//           console.log('b');
//           connection.addTrack(track, screenShareStream.current);
//         });
//       });

//       // Notify others
//       socket.current.emit(ACTIONS.START_SCREEN_SHARE, {
//         roomId,
//         userId: user.id,
//       });

//       // Stop screen sharing when the user stops it manually
//       stream.getVideoTracks()[0].onended = () => {
//         setScreenSharer(null);
//         socket.current.emit(ACTIONS.STOP_SCREEN_SHARE, {
//           roomId,
//           userId: user.id,
//         });
//       };
//     } catch (err) {
//       console.error("Error sharing screen", err);
//     }
//   };

//   const clientReducer = (state, action) => {
//     switch (action.type) {
//       case "ADD_CLIENT":
//         const existingClient = state.find(
//           (client) => client.id === action.payload.id
//         );
//         if (existingClient) {
//           // Update existing client
//           return state.map((client) =>
//             client.id === action.payload.id
//               ? { ...client, ...action.payload }
//               : client
//           );
//         }
//         // Add new client
//         return [...state, action.payload];
//       case "REMOVE_CLIENT":
//         return state.filter((client) => client.id !== action.payload);
//       default:
//         return state;
//     }
//   };

//   const [clients, dispatchClients] = useReducer(clientReducer, []);

//   useEffect(() => {
//     const fetchRoom = async () => {
//       try {
//         const accessToken = localStorage.getItem("accessToken");
//         const { data } = await getRoom({ roomId, accessToken });
//         setRoom(data);
//       } catch (err) {
//         console.error("Error fetching room details", err);
//       }
//     };
//     fetchRoom();
//   }, [roomId]);

//   useEffect(() => {
//     muteStateRef.current.muteInfo = isMuted;
//     handleMute(isMuted, user.id);
//   }, [isMuted]);
//   useEffect(() => {
//     videoStateRef.current.muteInfo = isMuted;
//     handleVideo(isVideo, user.id);
//   }, [isVideo]);
//   const provideRef = (ref, userId, callback) => {
//     if (ref.current[userId]) {
//       callback(ref.current[userId]);
//     } else {
//       const interval = setInterval(() => {
//         if (ref.current[userId]) {
//           callback(ref.current[userId]);
//           clearInterval(interval);
//         }
//       }, 100);
//     }
//   };

//   const handleMuteClick = (clientId) => {
//     if (clientId !== user.id) {
//       return;
//     }
//     setMuted((prev) => !prev);
//     dispatchClients({
//       type: "ADD_CLIENT",
//       payload: { id: clientId, muted: !isMuted }, // Update client state
//     });
//   };
//   const handleVideoClick = (clientId) => {
//     if (clientId !== user.id) {
//       return;
//     }
//     setVideo((prev) => !prev);
//     dispatchClients({
//       type: "ADD_CLIENT",
//       payload: { id: clientId, video: !isVideo }, // Update client state
//     });
//   };
//   const addNewClient = useCallback((newClient, cb) => {
//     dispatchClients({ type: "ADD_CLIENT", payload: newClient });
//     if (cb) cb();
//   }, []);

//   useEffect(() => {
//     const initChat = async () => {
//       try {
//         socket.current = socketInit();
//         localMediaStream.current = await navigator.mediaDevices.getUserMedia({
//           audio: true,
//           video: true,
//         });
//         localMediaStream.current.getAudioTracks().forEach((track) => {
//           track.enabled = false;
//         });
//         localMediaStream.current.getVideoTracks().forEach((track) => {
//           track.enabled = false;
//         });
//         addNewClient({ ...user, muted: true, video: false }, () => {
//           provideRef(audioElements, user.id, (element) => {
//             element.volume = 0;
//             element.srcObject = localMediaStream.current;
//           });

//           provideRef(videoElements, user.id, (element) => {
//             element.srcObject = localMediaStream.current;
//           });
//         });

//         socket.current.on(ACTIONS.ADD_PEER, handleNewPeer);
//         socket.current.on(ACTIONS.REMOVE_PEER, handleRemovePeer);
//         socket.current.on(ACTIONS.ICE_CANDIDATE, handleIceCandidate);
//         socket.current.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);
//         socket.current.on(ACTIONS.MUTE, ({ userId }) =>
//           handleSetMute(true, userId)
//         );
//         socket.current.on(ACTIONS.UNMUTE, ({ userId }) =>
//           handleSetMute(false, userId)
//         );
//         socket.current.on(ACTIONS.VIDEO_ON, ({ userId }) =>
//           handleSetVideo(true, userId)
//         );
//         socket.current.on(ACTIONS.VIDEO_OFF, ({ userId }) =>
//           handleSetVideo(false, userId)
//         );
//         socket.current.on(
//           "mute_state",
//           ({ mute_info, userAbout, video_info }) =>
//             dispatchClients({
//               type: "ADD_CLIENT",
//               payload: {
//                 id: userAbout.id,
//                 muted: mute_info,
//                 video:  !video_info,
//               },
//             })
//         );
//         socket.current.on(ACTIONS.START_SCREEN_SHARE, ({ userId }) => {
//           console.log('screening started');
//           setScreenSharer(userId);
//         });
//         socket.current.on(ACTIONS.STOP_SCREEN_SHARE, () => {
//           setScreenSharer(null);
//         });

//         socket.current.emit(ACTIONS.JOIN, { roomId, user });
//       } catch (err) {
//         console.error("Error initializing chat", err);
//       }
//     };

//     const handleNewPeer = async ({ peerId, createOffer, user: remoteUser }) => {
//       // console.log('dekh',muteStateRef.current);
//       if (connections.current[peerId]) {
//         console.warn(`Already connected with ${peerId}`);
//         return;
//       }

//       addNewClient({ ...remoteUser, muted: true });

//       connections.current[peerId] = new RTCPeerConnection({
//         iceServers: freeice(),
//       });

//       connections.current[peerId].onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.current.emit(ACTIONS.RELAY_ICE, {
//             peerId,
//             icecandidate: event.candidate,
//           });
//         }
//       };
//       connections.current[peerId].ontrack = ({ streams: [remoteStream] }) => {
//         console.log('bol bhai',remoteStream);
//         remoteStream.getTracks().forEach((track) => {
//           if (track.kind === "audio") {
//             provideRef(audioElements, remoteUser.id, (element) => {
//               element.srcObject = remoteStream;
//             });
//           } else if (track.kind === "video") {
//             provideRef(videoElements, remoteUser.id, (element) => {
//               element.srcObject = remoteStream;
//               if (remoteUser.id === screenSharer) {
//                 element.classList.add(styles.screenShareVideo);
//               }
//             });
//           }
//         });
//       };

//       localMediaStream.current.getTracks().forEach((track) => {
//         connections.current[peerId].addTrack(track, localMediaStream.current);
//       });

//       if (createOffer) {
//         const offer = await connections.current[peerId].createOffer();
//         await connections.current[peerId].setLocalDescription(offer);
//         socket.current.emit(ACTIONS.RELAY_SDP, {
//           peerId,
//           sessionDescription: offer,
//         });
//       }
//       socket.current.emit("mute_state", {
//         peerId,
//         mute_info: muteStateRef.current.muteInfo,
//         userAbout: user,
//         video_info: videoStateRef.current.muteInfo,
//       });
//     };

//     const handleRemovePeer = ({ peerId, userId }) => {
//       if (connections.current[peerId]) {
//         connections.current[peerId].close();
//         delete connections.current[peerId];
//       }

//       dispatchClients({ type: "REMOVE_CLIENT", payload: userId });
//     };

//     const handleIceCandidate = ({ peerId, icecandidate }) => {
//       if (connections.current[peerId]) {
//         connections.current[peerId].addIceCandidate(icecandidate);
//       }
//     };

//     const setRemoteMedia = async ({
//       peerId,
//       sessionDescription: remoteSessionDescription,
//     }) => {
//       const connection = connections.current[peerId];
//       await connection.setRemoteDescription(
//         new RTCSessionDescription(remoteSessionDescription)
//       );

//       if (remoteSessionDescription.type === "offer") {
//         const answer = await connection.createAnswer();
//         await connection.setLocalDescription(answer);
//         socket.current.emit(ACTIONS.RELAY_SDP, {
//           peerId,
//           sessionDescription: answer,
//         });
//       }
//     };

//     const handleSetMute = (mute, userId) => {
//       dispatchClients({
//         type: "ADD_CLIENT",
//         payload: { id: userId, muted: mute },
//       });

//       if (userId === user.id) {
//         setMuted(mute);
//         // Update the local audio stream
//         if (localMediaStream.current) {
//           const audioTracks = localMediaStream.current.getAudioTracks();
//           if (audioTracks.length > 0) {
//             audioTracks[0].enabled = !mute; // Enable or disable the audio track
//           }
//         }
//         // Update the audio element for the local user
//         // if (audioElements.current[userId]) {
//         //   audioElements.current[userId].muted = mute; // Sync the audio element state
//         // }
//       }
//     };
//     const handleSetVideo = (videoState, userId) => {
//       dispatchClients({
//         type: "ADD_CLIENT",
//         payload: { id: userId, video: videoState },
//       });
//       if (userId === user.id) {
//         setVideo(videoState);
//         // Update the local audio stream
//         if (localMediaStream.current) {
//           const videoTracks = localMediaStream.current.getVideoTracks();
//           if (videoTracks.length > 0) {
//             videoTracks[0].enabled = videoState; // Enable or disable the audio track
//           }
//         }
//         // Update the audio element for the local user
//         // if (audioElements.current[userId]) {
//         //   audioElements.current[userId].muted = mute; // Sync the audio element state
//         // }
//       }
//     };

//     initChat();

//     return () => {
//       if (socket.current) {
//         socket.current.disconnect();
//         socket.current = null;
//       }

//       if (localMediaStream.current) {
//         localMediaStream.current.getTracks().forEach((track) => track.stop());
//       }
//     };
//   }, [roomId, user]);

//   const handleMute = (isMute, userId) => {
//     if (userId === user.id && localMediaStream.current) {
//       localMediaStream.current.getTracks()[0].enabled = !isMute;
//       if (isMute) {
//         socket.current.emit(ACTIONS.MUTE, {
//           roomId,
//           userId: user.id,
//         });
//       } else {
//         socket.current.emit(ACTIONS.UNMUTE, {
//           roomId,
//           userId: user.id,
//         });
//       }
//     }
//   };
//   const handleVideo = (videoState, userId) => {
//     if (userId === user.id && localMediaStream.current) {
//       localMediaStream.current.getVideoTracks()[0].enabled = videoState;
//       if (videoState) {
//         socket.current.emit(ACTIONS.VIDEO_ON, {
//           roomId,
//           userId: user.id,
//         });
//       } else {
//         socket.current.emit(ACTIONS.VIDEO_OFF, {
//           roomId,
//           userId: user.id,
//         });
//       }
//     }
//   };

//   const handManualLeave = () => {
//     history("/rooms");
//   };

//   return screenSharer ? (
//     <video
//       autoPlay
//       muted
//       className={styles.screenShareVideo}
//       ref={(instance) => {
//         if (instance && screenSharer === user.id && screenShareStream.current) {
//           instance.srcObject = screenShareStream.current;
//         }
//         //instance.srcObject = screenShareStream.current;
//       }}
//     />
//   ) : (
//     <div>
//       <div className="container">
//         <button onClick={handManualLeave} className={styles.goBack}>
//           <img src="/images/arrow-left.png" alt="arrow-left" />
//           <span>All voice rooms</span>
//         </button>
//       </div>
//       <div className={styles.clientsWrap}>
//         <div className={styles.header}>
//           {room && <h2 className={styles.topic}>{room.topic}</h2>}
//           <div className={styles.actions}>
//             <button className={styles.actionBtn}>
//               <img src="/images/palm.png" alt="palm-icon" />
//             </button>
//             <button onClick={handManualLeave} className={styles.actionBtn}>
//               <img src="/images/win.png" alt="win-icon" />
//               <span>Leave quietly</span>
//             </button>
//           </div>
//         </div>
//         <div className={styles.clientsList}>
//           {clients.map((client) => (
//             <div className={styles.client} key={client.id}>
//               <div className={styles.userHead}>
//                 <img className={styles.userAvatar} src={client.avatar} alt="" />
//                 <audio
//                   autoPlay
//                   ref={(instance) => {
//                     if (instance) {
//                       audioElements.current[client.id] = instance;
//                     }
//                   }}
//                 />
//                 <video
//                   autoPlay
//                   muted
//                   style={{ width: "100px", height: "100px" }}
//                   ref={(instance) => {
//                     if (instance) {
//                       videoElements.current[client.id] = instance;
//                     }
//                   }}
//                 />
//                 <button
//                   onClick={() => handleMuteClick(client.id)}
//                   className={styles.micBtn}
//                 >
//                   {client.muted ? (
//                     <img
//                       className={styles.mic}
//                       src="/images/mic-mute.png"
//                       alt="mic"
//                     />
//                   ) : (
//                     <img
//                       className={styles.micImg}
//                       src="/images/mic.png"
//                       alt="mic"
//                     />
//                   )}
//                 </button>
//                 <button
//                   onClick={() => handleVideoClick(client.id)}
//                   className={styles.videoBtn}
//                 >
//                   {client.video ? (
//                     <img className={styles.mic} src="/no-video.png" alt="mic" />
//                   ) : (
//                     <img
//                       className={styles.videoOn}
//                       src="/videoOn3.png"
//                       alt="mic"
//                     />
//                   )}
//                 </button>
//               </div>
//               <h4>{client.name}</h4>
//             </div>
//           ))}
//         </div>
//         <div className={styles.shareBtn}>
//         <button
//                   onClick={() => handleScreenShare(user.id)}
//                   className={styles.screenShareBtn}
//                 >
//                   <img
//                     className={styles.screenShareImg}
//                     src="/images/screen-share.png"
//                     alt="screen-share"
//                   />
//                 </button>
//         </div>
//       </div>
//     </div>
//   );
// };
// export default Room;

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useReducer,
} from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { getRoom } from "../../http";
import styles from "./Room.module.css";
import { ACTIONS } from "../../actions";
import socketInit from "../../socket";
import freeice from "freeice";
import InputEmoji from "react-input-emoji";
import "../../components/Chat/ChatBox.css";
const Room = () => {
  const user = useSelector((state) => state.auth.user);
  const { id: roomId } = useParams();
  const history = useNavigate();
  const [room, setRoom] = useState(null);
  const [isMuted, setMuted] = useState(true);
  const [isVideo, setVideo] = useState(false);
  const audioElements = useRef({});
  const muteStateRef = useRef({});
  const videoStateRef = useRef({});
  const videoElements = useRef({});
  const connections = useRef({});
  const socket = useRef(null);
  const localMediaStream = useRef(null);
  const scroll = useRef();
  const imageRef = useRef();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const handleChange = (message) => setNewMessage(message);
  useEffect(() => {
    scroll.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const handleSend = () => {
    if (!newMessage) return;
    if (newMessage.trim()) {
      const newMsg = {
        text: newMessage,
        senderId: user.id,
        senderUrl: user.avatar,
        senderName: user.name,
      };
      setMessages((pre) => [...pre, newMsg]);
      const userSocketId = socket.current.id;
      socket.current.emit("new_message", { newMsg, roomId, userSocketId });
      setNewMessage("");
    }
  };

  const clientReducer = (state, action) => {
    switch (action.type) {
      case "ADD_CLIENT":
        const existingClient = state.find(
          (client) => client.id === action.payload.id
        );
        if (existingClient) {
          return state.map((client) =>
            client.id === action.payload.id
              ? { ...client, ...action.payload }
              : client
          );
        }
        return [...state, action.payload];
      case "REMOVE_CLIENT":
        return state.filter((client) => client.id !== action.payload);
      default:
        return state;
    }
  };

  const [clients, dispatchClients] = useReducer(clientReducer, []);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const { data } = await getRoom({ roomId, accessToken });
        setRoom(data);
      } catch (err) {
        console.error("Error fetching room details", err);
      }
    };
    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    muteStateRef.current.muteInfo = isMuted;
    handleMute(isMuted, user.id);
  }, [isMuted]);
  useEffect(() => {
    videoStateRef.current.muteInfo = isMuted;
    handleVideo(isVideo, user.id);
  }, [isVideo]);
  const provideRef = (ref, userId, callback) => {
    if (ref.current[userId]) {
      callback(ref.current[userId]);
    } else {
      const interval = setInterval(() => {
        if (ref.current[userId]) {
          callback(ref.current[userId]);
          clearInterval(interval);
        }
      }, 100);
    }
  };
  const handleMuteClick = (clientId) => {
    if (clientId !== user.id) {
      return;
    }
    setMuted((prev) => !prev);
    dispatchClients({
      type: "ADD_CLIENT",
      payload: { id: clientId, muted: !isMuted }, // Update client state
    });
  };
  const handleVideoClick = (clientId) => {
    if (clientId !== user.id) {
      return;
    }
    setVideo((prev) => !prev);
    dispatchClients({
      type: "ADD_CLIENT",
      payload: { id: clientId, video: !isVideo }, // Update client state
    });
  };
  const addNewClient = useCallback((newClient, cb) => {
    dispatchClients({ type: "ADD_CLIENT", payload: newClient });
    if (cb) cb();
  }, []);
  useEffect(() => {
    const initChat = async () => {
      try {
        socket.current = socketInit();
        localMediaStream.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: 1280, height: 720 },
        });
        localMediaStream.current.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
        localMediaStream.current.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
        addNewClient({ ...user, muted: true, video: false }, () => {
          provideRef(audioElements, user.id, (element) => {
            element.volume = 0;
            element.srcObject = localMediaStream.current;
          });

          provideRef(videoElements, user.id, (element) => {
            element.srcObject = localMediaStream.current;
          });
        });

        socket.current.on(ACTIONS.ADD_PEER, handleNewPeer);
        socket.current.on(ACTIONS.REMOVE_PEER, handleRemovePeer);
        socket.current.on(ACTIONS.ICE_CANDIDATE, handleIceCandidate);
        socket.current.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);
        socket.current.on(ACTIONS.MUTE, ({ userId }) =>
          handleSetMute(true, userId)
        );
        socket.current.on(ACTIONS.UNMUTE, ({ userId }) =>
          handleSetMute(false, userId)
        );
        socket.current.on(ACTIONS.VIDEO_ON, ({ userId }) =>
          handleSetVideo(true, userId)
        );
        socket.current.on(ACTIONS.VIDEO_OFF, ({ userId }) =>
          handleSetVideo(false, userId)
        );
        socket.current.on(
          "mute_state",
          ({ mute_info, userAbout, video_info }) =>
            dispatchClients({
              type: "ADD_CLIENT",
              payload: {
                id: userAbout.id,
                muted: mute_info,
                video: !video_info,
              },
            })
        );
        socket.current.on("new_message", ({ newMsg }) => {
          setMessages((pre) => [...pre, newMsg]);
        });

        socket.current.emit(ACTIONS.JOIN, { roomId, user });
      } catch (err) {
        console.error("Error initializing chat", err);
      }
    };
    initChat();
    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current.off(ACTIONS.ADD_PEER, handleNewPeer);
        socket.current.off(ACTIONS.REMOVE_PEER, handleRemovePeer);
        socket.current.off(ACTIONS.ICE_CANDIDATE, handleIceCandidate);
        socket.current.off(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);
        socket.current = null;
      }
      if (localMediaStream.current) {
        localMediaStream.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId, user]);
  const handleIceCandidate = ({ peerId, icecandidate }) => {
    if (connections.current[peerId]) {
      connections.current[peerId].addIceCandidate(icecandidate);
    }
  };
  const handleNewPeer = async ({ peerId, createOffer, user: remoteUser }) => {
    if (connections.current[peerId]) {
      console.warn(`Already connected with ${peerId}`);
      return;
    }

    addNewClient({ ...remoteUser, muted: true });

    connections.current[peerId] = new RTCPeerConnection({
      iceServers: freeice(),
    });

    connections.current[peerId].onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit(ACTIONS.RELAY_ICE, {
          peerId,
          icecandidate: event.candidate,
        });
      }
    };
    connections.current[peerId].ontrack = ({ streams: [remoteStream] }) => {
      remoteStream.getTracks().forEach((track) => {
        if (track.kind === "audio") {
          provideRef(audioElements, remoteUser.id, (element) => {
            element.srcObject = remoteStream;
          });
        } else if (track.kind === "video") {
          provideRef(videoElements, remoteUser.id, (element) => {
            element.srcObject = remoteStream;
          });
        }
      });
    };

    localMediaStream.current.getTracks().forEach((track) => {
      connections.current[peerId].addTrack(track, localMediaStream.current);
    });

    if (createOffer) {
      const offer = await connections.current[peerId].createOffer();
      await connections.current[peerId].setLocalDescription(offer);
      socket.current.emit(ACTIONS.RELAY_SDP, {
        peerId,
        sessionDescription: offer,
      });
    }
    socket.current.emit("mute_state", {
      peerId,
      mute_info: muteStateRef.current.muteInfo,
      userAbout: user,
      video_info: videoStateRef.current.muteInfo,
    });
  };

  const handleRemovePeer = ({ peerId, userId }) => {
    if (connections.current[peerId]) {
      connections.current[peerId].close();
      delete connections.current[peerId];
    }

    dispatchClients({ type: "REMOVE_CLIENT", payload: userId });
  };

  const handleSetVideo = (videoState, userId) => {
    dispatchClients({
      type: "ADD_CLIENT",
      payload: { id: userId, video: videoState },
    });
    if (userId === user.id) {
      setVideo(videoState);
      // Update the local audio stream
      if (localMediaStream.current) {
        const videoTracks = localMediaStream.current.getVideoTracks();
        if (videoTracks.length > 0) {
          videoTracks[0].enabled = videoState; // Enable or disable the audio track
        }
      }
      // Update the audio element for the local user
      if (audioElements.current[userId]) {
        audioElements.current[userId].muted = isMuted; // Sync the audio element state
      }
    }
  };
  const setRemoteMedia = async ({
    peerId,
    sessionDescription: remoteSessionDescription,
  }) => {
    const connection = connections.current[peerId];
    if (!connection) {
      console.error(
        `No RTCPeerConnection found for peerId: ${peerId} , ${socket.current.id}`
      );
      return;
    }

    try {
      // Check signaling state to prevent redundant operations
      if (
        connection.signalingState === "stable" &&
        remoteSessionDescription.type === "answer"
      ) {
        console.warn(
          `Connection for peer ${peerId} is already stable. Skipping.${socket.current.id}`
        );
        return;
      }

      await connection.setRemoteDescription(
        new RTCSessionDescription(remoteSessionDescription)
      );

      if (remoteSessionDescription.type === "offer") {
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        socket.current.emit(ACTIONS.RELAY_SDP, {
          peerId,
          sessionDescription: answer,
        });
      }
    } catch (error) {
      console.error(
        `Error in setRemoteMedia for peerId: ${peerId},${socket.current.id}`,
        error
      );
    }
  };

  const handleSetMute = (mute, userId) => {
    dispatchClients({
      type: "ADD_CLIENT",
      payload: { id: userId, muted: mute },
    });

    if (userId === user.id) {
      setMuted(mute);
      // Update the local audio stream
      if (localMediaStream.current) {
        const audioTracks = localMediaStream.current.getAudioTracks();
        if (audioTracks.length > 0) {
          audioTracks[0].enabled = !mute; // Enable or disable the audio track
        }
      }
      // Update the audio element for the local user
      // if (audioElements.current[userId]) {
      //   audioElements.current[userId].muted = mute; // Sync the audio element state
      // }
    }
  };
  const handleMute = (isMute, userId) => {
    if (userId === user.id && localMediaStream.current) {
      localMediaStream.current.getTracks()[0].enabled = !isMute;
      if (isMute) {
        socket.current.emit(ACTIONS.MUTE, {
          roomId,
          userId: user.id,
        });
      } else {
        socket.current.emit(ACTIONS.UNMUTE, {
          roomId,
          userId: user.id,
        });
      }
    }
  };
  const handleVideo = (videoState, userId) => {
    if (userId === user.id && localMediaStream.current) {
      localMediaStream.current.getVideoTracks()[0].enabled = videoState;
      if (videoState) {
        socket.current.emit(ACTIONS.VIDEO_ON, {
          roomId,
          userId: user.id,
        });
      } else {
        socket.current.emit(ACTIONS.VIDEO_OFF, {
          roomId,
          userId: user.id,
        });
      }
    }
  };

  const handManualLeave = () => {
    history("/rooms");
  };
  return (
    <div className={styles.mainContainer}>
      <div className={styles.mainContainerbbb}>
        <div className="container">
          <button onClick={handManualLeave} className={styles.goBack}>
            <img src="/images/arrow-left.png" alt="arrow-left" />
            <span>All voice rooms</span>
          </button>
        </div>
        <div className={styles.myDiv}>
          <div className={styles.clientsWrap}>
            {/* <div className={styles.header}>
          {room && <h2 className={styles.topic}>{room.topic}</h2>}
          <div className={styles.actions}>
            <button className={styles.actionBtn}>
              <img src="/images/palm.png" alt="palm-icon" />
            </button>
            <button onClick={handManualLeave} className={styles.actionBtn}>
              <img src="/images/win.png" alt="win-icon" />
              <span>Leave quietly</span>
            </button>
          </div>
        </div> */}
            <div className={styles.clientsList}>
              {clients.map((client) => (
                <div className={styles.client} key={client.id}>
                  <div className={styles.userHead}>
                    {/* <img className={styles.userAvatar} src={client.avatar} alt="" /> */}
                    <audio
                      autoPlay
                      ref={(instance) => {
                        if (instance) {
                          audioElements.current[client.id] = instance;
                        }
                      }}
                    />
                    <div className={styles.containerb}>
                      <div className={styles.upper_box}>
                        {/* <video
                        autoPlay
                        muted
                        style={{
                          width: "300px",
                          height: "180px",
                          borderRadius: "12px",
                        }}
                        ref={(instance) => {
                          if (instance) {
                            videoElements.current[client.id] = instance;
                          }
                        }}
                      /> */}
                        {client.video ? (
                          <video
                            autoPlay
                            muted
                            style={{
                              width: "300px",
                              height: "180px",
                              borderRadius: "12px",
                            }}
                            ref={(instance) => {
                              if (instance) {
                                videoElements.current[client.id] = instance;
                              }
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "300px",
                              height: "180px",
                              borderRadius: "12px",
                              backgroundColor: "#000",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <img
                              src={client.avatar}
                              alt={client.name}
                              style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div className={styles.lower_box}>
                        <div className={styles.micDiv}>
                          <h4>{client.name}</h4>
                          <button
                            onClick={() => handleMuteClick(client.id)}
                            className={styles.micBtn}
                          >
                            {client.muted ? (
                              <img
                                className={styles.mic}
                                src="/images/mic-mute.png"
                                alt="mic"
                              />
                            ) : (
                              <img
                                className={styles.micImg}
                                src="/images/mic.png"
                                alt="mic"
                              />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* <button
                  onClick={() => handleVideoClick(client.id)}
                  className={styles.videoBtn}
                >
                  {client.video ?  <img
                      className={styles.mic}
                      src="/no-video.png"
                      alt="mic"
                    /> :
                     <img
                      className={styles.videoOn}
                      src="/videoOn3.png"
                      alt="mic"
                    />
                    }
                </button> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.chatDivv}>
            <div className="ChatBox-container">
              <div className="chat-body">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    ref={scroll}
                    className={
                      message.senderId === user.id ? "message own" : "message"
                    }
                  >
                    {/* Sender Details */}
                    <div className="sender-details">
                      {message.senderUrl && (
                        <img
                          src={message.senderUrl}
                          alt={message.senderName}
                          className="sender-avatar"
                        />
                      )}
                      <span className="sender-name">{message.senderName}</span>
                    </div>
                    {/* Message Content */}
                    <div className="message-content">
                      <span>{message.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Sender */}
              <div className="chat-sender">
                <div
                  className="add-image"
                  onClick={() => imageRef.current.click()}
                >
                  +
                </div>
                <InputEmoji
                  value={newMessage}
                  onChange={handleChange}
                  placeholder="Type a message"
                />
                <div className="send-button" onClick={handleSend}>
                  Send
                </div>
                <input
                  type="file"
                  style={{ display: "none" }}
                  ref={imageRef}
                  accept="image/*"
                />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.navbar}>
          <div className={styles.videoBtnn}>
            <button
              onClick={() => handleVideoClick(user.id)}
              className={styles.micBtnn}
            >
              {isVideo ? (
                <img className={styles.micc} src="/no-video.png" alt="mic" />
              ) : (
                <img className={styles.video_main} src="/newc.png" alt="mic" />
              )}
            </button>
          </div>
          <div className={styles.videoBtnn}>
            <button
              onClick={() => handleMuteClick(user.id)}
              className={styles.micBtn}
            >
              {isMuted ? (
                <img
                  className={styles.mic_mute}
                  src="/images/mic-mute.png"
                  alt="mic"
                />
              ) : (
                <img
                  className={styles.micImg}
                  src="/images/mic.png"
                  alt="mic"
                />
              )}
            </button>
          </div>
          <div className={styles.videoBtnn}>
            <button onClick={handManualLeave} className={styles.micBtnnn}>
              <img className={styles.miccc} src="/circle.png" alt="mic" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Room;
