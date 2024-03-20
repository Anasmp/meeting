import React, { useEffect, useRef,useState} from 'react';
import useMediaSoup from './useMediaSoup';
import styled,{css} from 'styled-components';
import './index.css'
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash } from 'react-icons/fa';

const calculateGridTemplate = (participants) => {
  return `repeat(auto-fit, minmax(200px, 1fr))`;
};

const Layout = styled.div`
  display: grid;
  grid-gap: 10px;
  grid-template-columns: ${props => calculateGridTemplate(props.participants)};
  padding: 10px;
  height: 90vh;
  overflow: auto;
`;

const VideoFeed = styled.div`
  aspect-ratio: 16 / 9;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius:5px;
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

    const Header = styled.header`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 60px; // Adjust height as needed
    color: white;
    display: flex;
    padding-left:30px;
    align-items: center;
    font-size: 24px; // Adjust font size as needed
    font-weight:'bold';
    z-index: 2; // Ensure the header is above all other content
    `;


const VideoChat = () => {
    
    const { remoteStreams } = useMediaSoup();
    const [isAudioMuted, setIsAudioMuted] = useState(false); 
    const [isVideoOn, setIsVideoOn] = useState(true);
    const localVideoRef = useRef(null);

    const toggleMute = () => {
        setIsAudioMuted(!isAudioMuted);
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
            <LocalVideo ref={localVideoRef} id="localVideo" autoPlay playsInline  muted={isAudioMuted}  className="video"  style={{borderRadius:5}} />
            <Layout participants={remoteStreams.length}>
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
