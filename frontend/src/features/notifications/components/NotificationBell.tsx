import React, { useState } from 'react';
import { Popover, Button, List, Spin } from 'antd';
import { useNavigate } from 'react-router';
import { useNotifications, AppNotification } from '../../../hooks/useNotifications';
import { Bell, Check, Settings } from '../../../assets/icons';

const NotificationCenter: React.FC<{
  notifications: AppNotification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigate: (url: string, id: string) => void;
  onClose: () => void;
}> = ({ notifications, loading, onMarkAsRead, onMarkAllAsRead, onNavigate, onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="flex max-h-[440px] w-[380px] flex-col overflow-hidden rounded-[12px] border border-[#e5e5e5] bg-white shadow-[0_12px_35px_rgba(0,0,0,0.12)]">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eeeeee] bg-white px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-800 m-0">Notifications</h3>
        <div className="flex gap-2">
          <Button
            type="text"
            size="small"
            icon={<span className="anticon"><Check className="w-[14px] h-[14px]" /></span>}
            onClick={onMarkAllAsRead}
            disabled={notifications.every(n => n.isRead)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Mark all read
          </Button>
          <Button
            type="text"
            size="small"
            icon={<span className="anticon"><Settings className="w-[14px] h-[14px]" /></span>}
            onClick={() => {
              onClose();
              navigate('/settings');
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-0">
        {loading && notifications.length === 0 ? (
          <div className="p-6 text-center"><Spin size="small" /></div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No new notifications</div>
        ) : (
          <List
            className="m-0"
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={item => (
              <List.Item
                className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-50 ${!item.isRead ? 'bg-blue-50/50' : 'bg-white'}`}
                onClick={() => {
                  if (!item.isRead) onMarkAsRead(item.id);
                  onNavigate(item.actionUrl || '/notifications', item.id);
                }}
              >
                <div className="w-full flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!item.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                    <div className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.message}</div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : new Date(item.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>

      <div className="border-t border-[#eeeeee] bg-gray-50 px-4 py-2.5 text-center">
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate('/notifications');
          }}
          className="text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          View all notifications →
        </button>
      </div>
    </div>
  );
};

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNavigate = (url: string, _id: string) => {
    setOpen(false);
    navigate(url);
  };

  return (
    <Popover
      content={
        <NotificationCenter
          notifications={notifications}
          loading={false}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onNavigate={handleNavigate}
          onClose={() => setOpen(false)}
        />
      }
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      styles={{ container: { padding: 0 } }}
      arrow={false}
    >
      <div className="relative inline-block">
        <button
          type="button"
          aria-label="Notifications"
          className="
            flex
            h-[42px]
            w-[42px]
            items-center
            justify-center
            rounded-full
            border-0
            bg-transparent
            p-0
            text-[#353535]
            transition
            hover:bg-[#f5f5f5]
          "
        >
          <Bell className="h-[20px] w-[20px] text-[#353535]" />
        </button>
        {unreadCount > 0 && (
          <span className="absolute right-[9px] top-[10px] flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
          </span>
        )}
      </div>
    </Popover>
  );
};
