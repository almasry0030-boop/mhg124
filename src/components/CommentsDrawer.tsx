import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Comment } from '../types';
import { StorageService } from '../services/storage';
import { X, Heart, Send, Pin, Trash2, Smile, MessageSquare } from 'lucide-react';

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  episodeId: string;
  seriesId: string;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isOpen,
  onClose,
  episodeId,
  seriesId,
}) => {
  const { user, isAdmin, setAuthModalOpen, showToast } = useApp();
  const [comments, setComments] = useState<Comment[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const QUICK_EMOJIS = ['❤️', '🔥', '👏', '😍', '🍿', '😱', '😂', '👑'];

  const reloadComments = () => {
    setComments(StorageService.getComments(episodeId));
  };

  useEffect(() => {
    if (isOpen) {
      reloadComments();
    }
  }, [isOpen, episodeId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    // Profanity check
    const forbidden = ['شتيمة', 'سيء_جداً_جداً'];
    const hasForbidden = forbidden.some((f) => inputText.includes(f));
    if (hasForbidden) {
      showToast('يرجى الالتزام بآداب الحوار في التعليقات');
      return;
    }

    const newComment = StorageService.addComment({
      seriesId,
      episodeId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      content: replyingTo ? `@${replyingTo.userName} ${inputText.trim()}` : inputText.trim(),
    });

    setInputText('');
    setReplyingTo(null);
    reloadComments();
    showToast('تمت إضافة تعليقك بنجاح! 💬');
  };

  const handleLike = (commentId: string) => {
    StorageService.likeComment(commentId);
    reloadComments();
  };

  const handleDelete = (commentId: string) => {
    StorageService.deleteComment(commentId);
    reloadComments();
    showToast('تم حذف التعليق');
  };

  return (
    <div
      className="absolute inset-x-0 bottom-0 top-1/3 z-50 rounded-t-3xl bg-[#10111A]/95 backdrop-blur-xl border-t border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-250 text-right touch-auto"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#FF2A55]" />
          <h3 className="font-bold text-sm text-white">
            التعليقات ({comments.length})
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="إغلاق التعليقات"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar touch-pan-y overscroll-contain">
        {comments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30 text-gray-500" />
            <p className="text-xs">كن أول من يعلق على هذه الحلقة!</p>
          </div>
        ) : (
          comments.map((c) => {
            const isOwner = user && user.id === c.userId;
            const canDelete = isOwner || isAdmin;

            return (
              <div key={c.id} className="flex gap-3 items-start group">
                <img
                  src={c.userAvatar}
                  alt={c.userName}
                  className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-200">
                        {c.userName}
                      </span>
                      {c.isPinned && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                          <Pin className="w-2.5 h-2.5" /> مثبت
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">منذ قليل</span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed break-words font-normal">
                    {c.content}
                  </p>

                  {/* Actions under comment */}
                  <div className="flex items-center gap-4 mt-1.5 text-[11px] text-gray-400">
                    <button
                      onClick={() => handleLike(c.id)}
                      className="flex items-center gap-1 hover:text-red-400 transition-colors"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          c.isLikedByMe ? 'fill-red-500 text-red-500' : ''
                        }`}
                      />
                      <span>{c.likesCount || 0}</span>
                    </button>

                    <button
                      onClick={() => {
                        setReplyingTo(c);
                        setInputText(`@${c.userName} `);
                      }}
                      className="hover:text-white transition-colors"
                    >
                      رد
                    </button>

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-400/80 hover:text-red-400 transition-colors"
                        title="حذف التعليق"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Emojis Bar */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-t border-white/5 overflow-x-auto no-scrollbar">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => setInputText((prev) => prev + emoji)}
            className="text-base hover:scale-125 active:scale-95 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-[#0B0B0F]">
        {replyingTo && (
          <div className="flex items-center justify-between text-[11px] text-[#FF2A55] mb-1.5 px-2">
            <span>الرد على: {replyingTo.userName}</span>
            <button
              type="button"
              onClick={() => {
                setReplyingTo(null);
                setInputText('');
              }}
              className="text-gray-400 hover:text-white"
            >
              إلغاء
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={user ? 'اكتب تعليقك الرائع هنا...' : 'سجل الدخول لإضافة تعليق'}
            className="flex-1 rounded-xl bg-[#1B1D2C] border border-white/10 px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF2A55] transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-9 h-9 rounded-xl bg-[#FF2A55] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#e02449] transition-all cursor-pointer"
            aria-label="إرسال التعليق"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
