import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function SearchableSelect({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Tanlang...", 
  labelKey = 'name', 
  valueKey = 'id',
  renderOption,
  disabled = false,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => String(opt[valueKey]) === String(value));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => {
    const label = String(opt[labelKey] || '').toLowerCase();
    const searchVal = search.toLowerCase();
    return label.includes(searchVal);
  });

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) setSearch('');
    }
  };

  const handleSelect = (opt) => {
    onChange(opt[valueKey]);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`searchable-select-container ${className}`} ref={containerRef}>
      <div 
        className={`searchable-select-trigger ${isOpen ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleToggle}
      >
        <div className="trigger-content">
          {selectedOption ? (
            <span className="selected-label">{selectedOption[labelKey]}</span>
          ) : (
            <span className="placeholder">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={18} className={`chevron ${isOpen ? 'rotate' : ''}`} />
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input 
              autoFocus
              className="search-input"
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div 
                  key={opt[valueKey]} 
                  className={`option-item ${String(opt[valueKey]) === String(value) ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  <div className="option-label">
                    {renderOption ? renderOption(opt) : opt[labelKey]}
                  </div>
                  {String(opt[valueKey]) === String(value) && <Check size={16} className="check-icon" />}
                </div>
              ))
            ) : (
              <div className="no-options">Hech narsa topilmadi</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
