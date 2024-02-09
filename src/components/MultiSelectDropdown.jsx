import React from 'react';
import Select from 'react-select';



export function MultiSelectDropdown({ options, selectedOptions, onChange }) {
  return (
    <Select
      options={options}
      placeholder="Select Album(s)"
      isMulti
      menuShouldScrollIntoView
      maxMenuHeight={300}
      value={selectedOptions}
      onChange={onChange}
      // controlShouldRenderValue={false}
      className="basic-multi-select"
      classNamePrefix="select"
      styles={{
        control: (provided) => ({
          ...provided,
          borderRadius: '0.375rem',
          width: "200px",
            // Adjust as needed
        }),
        option: (provided, state) => ({
          ...provided,
          backgroundColor: state.isSelected ?  state.isFocused ? '#3081cg' :'#3182ce' : 'white',
          color: state.isSelected ? 'white' : '#4a5568',
          
        }),
        menu: (provided, custom) => ({
          ...provided,
          maxHeight: "120px",
          borderRadius: "5px",
          padding: "2%",
          overflow: "hidden"
        })
      }}
    />
  );
};

