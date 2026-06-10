import React, { useState, useEffect, useRef } from 'react';
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
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const response = await axios.get(NOTIFICATIONS_API, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

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

  const dropdownBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const headingColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-150 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none text-white bg-red-500 transform translate-x-1/4 -translate-y-1/4">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className={`absolute right-0 mt-2.5 w-80 rounded-xl border shadow-2xl ${dropdownBg} overflow-hidden z-50`}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h3 className={`font-bold text-xs uppercase tracking-wider ${headingColor}`}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 focus:outline-none"
              >
                <MailOpen size={10} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-150 dark:divide-gray-700/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 text-left transition duration-150 cursor-pointer flex gap-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/30
                    ${!n.isRead ? 'bg-blue-50/25 dark:bg-blue-500/5' : ''}
                  `}
                >
                  {/* Alert Icon */}
                  <div className={`p-1.5 rounded-lg h-fit text-blue-600 dark:text-blue-400
                    ${n.type === 'DocumentShared' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-purple-50 dark:bg-purple-900/20'}
                  `}>
                    <AlertCircle size={14} />
                  </div>

                  {/* Body details */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!n.isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                      {n.message}
                    </p>
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 block">
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Actions (Mark single read) */}
                  {!n.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      className="p-1 text-gray-400 hover:text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded self-center"
                      title="Mark read"
                    >
                      <Check size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Real-time Toast Banner (slide-in) */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm p-4 rounded-xl border shadow-2xl bg-white dark:bg-gray-800 border-blue-500 dark:border-blue-700 flex items-start gap-3 animate-slide-in">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Bell size={18} className="animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">New Notification</h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{toast.message}</p>
            <button
              onClick={() => {
                setToast(null);
                handleNotificationClick(toast);
              }}
              className="mt-2 text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline"
            >
              <Eye size={10} />
              <span>View Document</span>
            </button>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
