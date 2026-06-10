import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, Check, Eye, Trash2, MailOpen, AlertCircle, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7072';
const NOTIFICATIONS_API = `${API_BASE}/api/Notifications`;

const NotificationBell = ({ token, hubConnection, theme }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState(null); // Active real-time notification toast
  const dropdownRef = useRef(null);

  // --- Fetch Notifications ---
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(NOTIFICATIONS_API, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // --- Click outside listener to close dropdown ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- SignalR Real-time Notification Listener ---
  useEffect(() => {
    if (!hubConnection) return;

    hubConnection.on('ReceiveNotification', (notification) => {
      console.log('SignalR: Received real-time notification:', notification);
      
      // Update state
      setNotifications(prev => [notification, ...prev]);

      // Show real-time Toast message
      setToast(notification);

      // Auto-hide toast after 5 seconds
      setTimeout(() => setToast(null), 5000);
    });

    return () => {
      hubConnection.off('ReceiveNotification');
    };
  }, [hubConnection]);

  // --- Actions ---
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(`${NOTIFICATIONS_API}/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(`${NOTIFICATIONS_API}/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleNotificationClick = async (n) => {
    setIsOpen(false);
    if (!n.isRead) {
      await handleMarkAsRead(n.id);
    }
    if (n.documentId) {
      navigate(`/documents/${n.documentId}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-sand-light hover:text-gold-light hover:bg-gold-glass/5 transition-all duration-300 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold leading-none text-cocoa-darkest bg-luxury-gold-button transform translate-x-1/4 -translate-y-1/4">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3.5 w-84 rounded-2xl border glass-panel shadow-3xl overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-gold-light/10 bg-cocoa-medium/20">
            <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-luxury-gradient">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] text-gold-light font-bold hover:underline flex items-center gap-1 focus:outline-none"
              >
                <MailOpen size={10} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gold-light/5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sand-light/50 text-xs tracking-wider">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => {
                const itemHover = theme === 'dark' ? 'hover:bg-gold-glass/10' : 'hover:bg-gold-glass/15';
                const itemUnread = !n.isRead ? (theme === 'dark' ? 'bg-gold-glass/5' : 'bg-gold-glass/10') : '';
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 text-left transition duration-150 cursor-pointer flex gap-3 ${itemHover} ${itemUnread}`}
                  >
                    {/* Alert Icon */}
                    <div className="p-2 rounded-xl h-fit border border-gold-light/10 text-gold-light bg-gold-glass">
                      <AlertCircle size={14} />
                    </div>

                    {/* Body details */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${!n.isRead ? 'font-bold text-sand-light dark:text-f5f0eb' : 'text-sand-light/70'}`}>
                        {n.message}
                      </p>
                      <span className="text-[9px] text-sand-light/40 mt-1 block font-medium">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Actions (Mark single read) */}
                    {!n.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        className="p-1.5 text-sand-light hover:text-gold-light hover:bg-gold-glass/5 rounded-lg self-center transition-all"
                        title="Mark read"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Floating Real-time Toast Banner (slide-in) */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm p-4.5 rounded-2xl glass-panel border border-gold-light/25 shadow-3xl flex items-start gap-3.5 animate-fade-in">
          <div className="p-2.5 rounded-xl bg-gold-glass text-gold-light border border-gold-light/10">
            <Bell size={18} className="animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-serif font-bold text-luxury-gradient uppercase tracking-widest">New Notification</h4>
            <p className="text-xs text-sand-light dark:text-f5f0eb mt-1 leading-relaxed">{toast.message}</p>
            <button
              onClick={() => {
                setToast(null);
                handleNotificationClick(toast);
              }}
              className="mt-2 text-[10px] text-gold-light font-bold flex items-center gap-1.5 hover:underline"
            >
              <Eye size={10} />
              <span>View Document</span>
            </button>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="p-1 rounded-full hover:bg-gold-glass/5 text-sand-light hover:text-gold-light transition-all"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
