import React from "react";
import styled from "styled-components";

const Loader = () => {
  return (
    <StyledWrapper>
<div className="loader">

</div>
      {/* <div id="page">
        <div id="container">
          <div id="ring" />
          <div id="ring" />
          <div id="ring" />
          <div id="ring" />
          <div id="h3">loading</div>
        </div>
      </div> */}
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  #page {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  #container {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  #h3 {
    color: white;
  }

  #ring {
    width: 190px;
    height: 190px;
    border: 1px solid transparent;
    border-radius: 50%;
    position: absolute;
  }

  #ring:nth-child(1) {
    border-bottom: 8px solid rgb(255, 141, 249);
    animation: rotate1 2s linear infinite;
  }

  @keyframes rotate1 {
    from {
      transform: rotateX(50deg) rotateZ(110deg);
    }

    to {
      transform: rotateX(50deg) rotateZ(470deg);
    }
  }

  #ring:nth-child(2) {
    border-bottom: 8px solid rgb(255, 65, 106);
    animation: rotate2 2s linear infinite;
  }

  @keyframes rotate2 {
    from {
      transform: rotateX(20deg) rotateY(50deg) rotateZ(20deg);
    }

    to {
      transform: rotateX(20deg) rotateY(50deg) rotateZ(380deg);
    }
  }

  #ring:nth-child(3) {
    border-bottom: 8px solid rgb(0, 255, 255);
    animation: rotate3 2s linear infinite;
  }

  @keyframes rotate3 {
    from {
      transform: rotateX(40deg) rotateY(130deg) rotateZ(450deg);
    }

    to {
      transform: rotateX(40deg) rotateY(130deg) rotateZ(90deg);
    }
  }

  #ring:nth-child(4) {
    border-bottom: 8px solid rgb(252, 183, 55);
    animation: rotate4 2s linear infinite;
  }

  @keyframes rotate4 {
    from {
      transform: rotateX(70deg) rotateZ(270deg);
    }

    to {
      transform: rotateX(70deg) rotateZ(630deg);
    }
  }
`;

export default Loader;




/* HTML: <div class="loader"></div> */
.loader {
  width: 12px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #000;
  clip-path: inset(-220%);
  animation: l28 2s infinite linear;
}
@keyframes l28 {
  0%  {box-shadow:0 0 0 0   , 40px 0,-40px 0,0 40px,0 -40px}
  10% {box-shadow:0 0 0 0   , 12px 0,-40px 0,0 40px,0 -40px}
  20% {box-shadow:0 0 0 4px , 0px  0,-40px 0,0 40px,0 -40px}
  30% {box-shadow:0 0 0 4px , 0px  0,-12px 0,0 40px,0 -40px}
  40% {box-shadow:0 0 0 8px , 0px  0,  0px 0,0 40px,0 -40px}
  50% {box-shadow:0 0 0 8px , 0px  0,  0px 0,0 12px,0 -40px}
  60% {box-shadow:0 0 0 12px, 0px  0,  0px 0,0  0px,0 -40px}
  70% {box-shadow:0 0 0 12px, 0px  0,  0px 0,0  0px,0 -12px}
  80% {box-shadow:0 0 0 16px, 0px  0,  0px 0,0  0px,0  0px }
  90%,
  100%{box-shadow:0 0 0 0   , 40px 0,-40px 0,0 40px,0 -40px}
}



/* HTML: <div class="loader"></div> */
.loader {
  --c1:#673b14;
  --c2:#f8b13b;
  width: 40px;
  height: 80px;
  border-top: 4px solid var(--c1);
  border-bottom: 4px solid var(--c1);
  background: linear-gradient(90deg, var(--c1) 2px, var(--c2) 0 5px,var(--c1) 0) 50%/7px 8px no-repeat;
  display: grid;
  overflow: hidden;
  animation: l5-0 2s infinite linear;
}
.loader::before,
.loader::after {
  content: "";
  grid-area: 1/1;
  width: 75%;
  height: calc(50% - 4px);
  margin: 0 auto;
  border: 2px solid var(--c1);
  border-top: 0;
  box-sizing: content-box;
  border-radius: 0 0 40% 40%;
  -webkit-mask: 
    linear-gradient(#000 0 0) bottom/4px 2px no-repeat,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: destination-out;
          mask-composite: exclude;
  background: 
    linear-gradient(var(--d,0deg),var(--c2) 50%,#0000 0) bottom /100% 205%,
    linear-gradient(var(--c2) 0 0) center/0 100%;
  background-repeat: no-repeat;
  animation: inherit;
  animation-name: l5-1;
}
.loader::after {
  transform-origin: 50% calc(100% + 2px);
  transform: scaleY(-1);
  --s:3px;
  --d:180deg;
}
@keyframes l5-0 {
  80%  {transform: rotate(0)}
  100% {transform: rotate(0.5turn)}
}
@keyframes l5-1 {
  10%,70%  {background-size:100% 205%,var(--s,0) 100%}
  70%,100% {background-position: top,center}
}