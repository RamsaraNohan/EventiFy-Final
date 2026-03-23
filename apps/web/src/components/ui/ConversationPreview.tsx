import { useAuthStore } from '../../lib/auth';
import { Avatar } from './Avatar';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function ConversationPreview({ conversation }: { conversation: any }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const other = conversation.participants?.find((p: any) => p.id !== user?.id)
    ?? conversation.otherUser
    ?? { name: conversation.participantName, avatar: conversation.participantAvatar };

  const lastMsg = conversation.lastMessage ?? conversation.Messages?.[0];

  return (
    <div
      onClick={() => navigate(`/messages?conv=${conversation.id}`)}
      className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
    >
      <div className="relative flex-shrink-0">
        <Avatar src={other?.avatarUrl || other?.avatar} name={other?.name} size="sm" />
        {other?.isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-sm font-medium text-gray-900 truncate">{other?.name ?? 'Unknown'}</span>
          {lastMsg && (
            <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
              {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: true })}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {lastMsg?.content ?? (lastMsg?.imageUrl ? '📷 Image' : 'No messages yet')}
        </p>
      </div>
      {(conversation.unreadCount ?? 0) > 0 && (
        <span className="w-5 h-5 bg-purple-600 rounded-full text-white text-[10px] font-medium flex items-center justify-center flex-shrink-0">
          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
        </span>
      )}
    </div>
  );
}
