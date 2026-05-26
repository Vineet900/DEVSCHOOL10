import React, { useRef, useEffect } from 'react';

const OTPInput = ({ value, onChange, length = 6 }) => {
  const inputs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (isNaN(Number(val))) return;

    const newValue = value.split('');
    newValue[index] = val.substring(val.length - 1);
    const finalValue = newValue.join('');
    onChange(finalValue);

    if (val && index < length - 1) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').substring(0, length);
    if (isNaN(Number(data))) return;
    onChange(data);
    inputs.current[Math.min(data.length, length - 1)].focus();
  };

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="w-full h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-black text-brand-cyan outline-none focus:border-brand-cyan/50 focus:bg-white/10 transition-all"
        />
      ))}
    </div>
  );
};

export default OTPInput;
