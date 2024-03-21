import React, { useEffect, useRef,useState} from 'react';
import useMediaSoup from './useMediaSoup';
import styled,{css} from 'styled-components';
import './index.css'
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash } from 'react-icons/fa';

const calculateGridTemplate = (participants) => {
    if (participants === 1) {
      return `1fr`;
    } else if (participants > 1 && participants <= 3) {
      return `repeat(${participants}, 1fr)`;
    }else if(participants > 3 && participants <= 8){
        return `repeat(auto-fit, minmax(300px, 1fr))`;
    } 
    else {
      return `repeat(auto-fit, minmax(200px, 1fr))`;
    }
  };
  

const VideoFeed = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 5px;
  background-color: #000; // Fallback for when there's no video
  
  ${({ participants }) => participants === 3 ? css`
    &::before {
      content: "";
      display: block;
      padding-top: 56.25%; // 16:9 Aspect Ratio for 2 participants
    }
  ` : css`
    &::before {
      content: "";
      display: block;
      padding-top: 75%; // 4:3 Aspect Ratio for more than 2 participants
    }
  `}
  
  video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover; // Cover the container without losing aspect ratio
  }
`;

const Layout = styled.div`
    display: grid;
    grid-gap: 10px;
    grid-template-columns: ${props => calculateGridTemplate(props.participants)};
    padding: 10px;
    height: 90vh;
    overflow: auto;
    justify-content: center; // This will help center the single item grid.
    align-items: center; // Vertically center in case of a single participant
`;

const LocalVideo = styled.video`
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 150px;
  height: auto;
  border: 2px solid white;
  z-index: 1;
`;
const Controls = styled.div`
    position: absolute;
    bottom: 20px;
    right: 20px;
    height: auto;
    z-index: 1;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px; // Increased size
  height: 60px; // Increased size
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 30px; // Adjusted for larger size to maintain roundness
  cursor: pointer;
  font-size: 24px; // Increase icon size
  &:hover {
    background-color: #34495e;
  }

  ${({ leaveCall }) =>
    leaveCall &&
    css`
      background-color: red; // Specific style for the Leave Call button
      border-radius: 50%; // Fully rounded
      color: white;
    `}
`;


const VideoChat = () => {
    
    const { remoteStreams } = useMediaSoup();
    const [isAudioMuted, setIsAudioMuted] = useState(false); 
    const [isVideoOn, setIsVideoOn] = useState(true);
    const localVideoRef = useRef(null);

    const toggleMute = () => {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            const videoTracks = localVideoRef.current.srcObject.getAudioTracks();
            if (videoTracks.length > 0) {
                const isOn = videoTracks[0].enabled;
                videoTracks[0].enabled = !isOn;
                setIsAudioMuted(!isAudioMuted); 
            }
        }
    };

    const toggleVideo = () => {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            const videoTracks = localVideoRef.current.srcObject.getVideoTracks();
            if (videoTracks.length > 0) {
                const isOn = videoTracks[0].enabled;
                videoTracks[0].enabled = !isOn;
                setIsVideoOn(!isOn); 
            }
        }
    };
    
    const MediaPlayer = ({ stream, id, kind }) => {
        const mediaRef = useRef(null);

        useEffect(() => {
            if (mediaRef.current) {
                mediaRef.current.srcObject = stream;
            }
        }, [stream]);

        if (kind === 'video') {
            return (
                <VideoFeed>
                    <video ref={mediaRef} autoPlay playsInline className="video" style={{borderRadius:5}} />
                </VideoFeed>
            );
        } else if (kind === 'audio') {
            return (
                <audio ref={mediaRef} autoPlay />
            );
        } else {
            return null; 
        }
    };

    return (
        <>
            <LocalVideo ref={localVideoRef} id="localVideo" autoPlay playsInline  muted  className="video"  style={{borderRadius:5}} />
            <Layout participants={remoteStreams.length/2}>
                {remoteStreams.map(streamInfo => (
                    <MediaPlayer key={streamInfo.id} {...streamInfo} />
                ))}

            </Layout>

            <Controls>
                <div style={{display:'flex',justifyContent:'center',marginBottom:20}}>
                    <div style={{color:'white',fontWeight:'bold',fontSize:23}}>Elance-Meet</div>
                </div>
                <Button onClick={toggleMute} title={isAudioMuted ? "Unmute" : "Mute"}  style={{marginRight:10}}>
                    {isAudioMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                </Button>
                <Button onClick={toggleVideo} title={isVideoOn ? "Turn Off Camera" : "Turn On Camera"} style={{marginRight:10}}>
                    {!isVideoOn ? <FaVideoSlash /> : <FaVideo />}
                </Button>
                <Button title="Leave Call" style={{backgroundColor:'red'}} onClick={()=>alert('meeting close')}>
                        <FaPhoneSlash />
                </Button>
            </Controls>
        
        </>
    );
};

export default VideoChat;
