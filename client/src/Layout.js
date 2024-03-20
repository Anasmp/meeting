import React, { useState } from 'react';
import styled, { css } from 'styled-components';

// const calculateGridTemplate = (participants) => {
//   return `repeat(auto-fit, minmax(200px, 1fr))`;
// };

// const Layout = styled.div`
//   display: grid;
//   grid-gap: 10px;
//   grid-template-columns: ${props => calculateGridTemplate(props.participants)};
//   padding: 10px;
//   height: 90vh;
//   overflow: auto;
// `;

// const VideoFeed = styled.div`
//   background-color: grey; // Placeholder for video feed
//   aspect-ratio: 16 / 9;
//   border: 2px solid black;
// `;


// const Button = styled.button`
//   background: none;
//   border: none;
//   color: white;
//   cursor: pointer;
//   padding: 10px;
//   border-radius: 50%;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   transition: background-color 0.3s;

//   &:hover {
//     background-color: rgba(255, 255, 255, 0.2);
//   }

//   ${props =>
//     props.danger &&
//     css`
//       color: #ea4335;
//     `}
// `;

// const Controls = styled.div`
//   display: flex;
//   justify-content: center;
//   padding: 10px;
//   background-color: #202124; 
// `;

function App() {
  const [participants, setParticipants] = useState(30); 

  return (
    <>
      <Layout participants={participants}>
        {Array.from({ length: participants }, (_, index) => (
          <VideoFeed key={index} />
        ))}
      </Layout>
      <Controls>
        <Button>Mute</Button>
        <Button>Turn Off Camera</Button>
        <Button>Leave Call</Button>
      </Controls>
    </>
  );
}

export default App;
