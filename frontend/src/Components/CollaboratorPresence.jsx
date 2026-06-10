import React, { useState, useEffect } from 'react';

const CollaboratorPresence = ({ awareness }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!awareness) return;

    const handleUpdate = () => {
      const states = awareness.getStates();
      const activeUsers = [];

      states.forEach((state, clientId) => {
        if (state.user) {
          activeUsers.push({
            clientId,
            name: state.user.name || 'Anonymous',
            color: state.user.color || '#3b82f6',
            email: state.user.email || ''
          });
        }
      });

      setUsers(activeUsers);
    };

    // Initialize list
    handleUpdate();

    // Listen for changes
    awareness.on('change', handleUpdate);

    return () => {
      awareness.off('change', handleUpdate);
    };
  }, [awareness]);

  const getInitials = (name) => {
    return name
      .split('@')[0] // If email, take first part
      .split(/[._-]/)[0] // Take first word
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex items-center space-x-2.5">
      <span className="text-[10px] uppercase tracking-widest text-sand-light/60 font-bold hidden sm:inline">
        {users.length} Active:
      </span>
      <div className="flex -space-x-2.5 overflow-hidden">
        {users.map((user) => (
          <div
            key={user.clientId}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gold-light/30 text-[10px] font-bold text-white shadow-md cursor-help transition-all duration-300 hover:scale-110"
            style={{ backgroundColor: user.color }}
            title={`${user.name} (${user.email || 'online'})`}
          >
            {getInitials(user.name)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollaboratorPresence;
