import React, { memo } from 'react';
import { CloudCheck } from 'lucide-react';
import styled from 'styled-components';

const SubmitButton = memo(({ label = 'Submit Sales & Refunds', onClick, disabled }) => {
  return (
    <StyledButton className='w-1/2 bg-gradient-primary justify-center' onClick={onClick} disabled={disabled} type="button">
      <span className="icon">
        <CloudCheck size={30} />
      </span>
      <span className="text">{label}</span>
    </StyledButton>
  );
});

const StyledButton = styled.button`
  font-family: inherit;
  font-size: 20px;
  color: white;
  padding: 0.4em 1em;
  display: flex;
  align-items: center;
  gap: 0.3em;
  cursor: pointer;
  border: none;
  border-radius: 15px;
  font-weight: 900;
  transition: background 0.3s ease, transform 0.2s ease;

  .icon {
    display: flex;
    align-items: center;
    transition: transform 0.3s ease;
  }

  .icon svg {
    stroke: rgb(155, 153, 153);
    transition: transform 0.3s ease, stroke 0.3s ease;
  }

  .text {
    transition: opacity 0.3s ease;
  }

  &:hover:not(:disabled) .icon {
    transform: scale(1.25);
  }

  &:hover:not(:disabled) .icon svg {
    transform: translateX(4.5em) scale(1.1);
    stroke: #fff;
  }

  &:hover:not(:disabled) .text {
    opacity: 0;
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default SubmitButton;
