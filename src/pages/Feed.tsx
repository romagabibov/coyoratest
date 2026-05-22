import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, deleteDoc, getDoc, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { moderateContent } from '../lib/moderation';

export default function Feed() {
  const { currentUser, isAdmin } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [feedType, setFeedType] = useState<'recent' | 'popular'>('recent');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [authorsInfo, setAuthorsInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    let q;
    if (feedType === 'recent') {
       q = query(collection(db, 'feedPosts'), orderBy('createdAt', 'desc'));
    } else {
       // A simple "popular" sorting by likes count
       q = query(collection(db, 'feedPosts'), orderBy('likesCount', 'desc'));
    }
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);

      // Fetch user info for posts
      const authors: Record<string, any> = { ...authorsInfo };
      for (const p of postsData) {
        if (!authors[p.userId]) {
            try {
              const udoc = await getDoc(doc(db, 'users', p.userId));
              if (udoc.exists()) {
                 authors[p.userId] = udoc.data();
              }
            } catch (e) { console.error('Error fetching user', e); }
        }
      }
      setAuthorsInfo(authors);
    });
    return () => unsubscribe();
  }, [feedType]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'feedLikes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
       const likes = new Set<string>();
       snapshot.docs.forEach(doc => {
          if (doc.data().userId === currentUser.uid) {
             likes.add(doc.data().postId);
          }
       });
       setUserLikes(likes);
    });
    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (!selectedPost) return;
    const q = query(collection(db, 'feedComments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(c => c.postId === selectedPost.id);
      setComments(commentsData);

      // Fetch user info for comments
      const authors: Record<string, any> = { ...authorsInfo };
      for (const c of commentsData) {
        if (!authors[c.userId]) {
            try {
              const udoc = await getDoc(doc(db, 'users', c.userId));
              if (udoc.exists()) {
                 authors[c.userId] = udoc.data();
              }
            } catch (e) { console.error('Error fetching user', e); }
        }
      }
      setAuthorsInfo(authors);
    });
    return () => unsubscribe();
  }, [selectedPost]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please log in to post.");
      return;
    }
    if (!newPostContent.trim() && !newPostImage.trim()) return;

    setIsSubmitting(true);
    try {
      const moderation = await moderateContent(newPostContent);
      if (!moderation.isAllowed) {
        alert("Your post couldn't be published because it violates community guidelines: " + moderation.reason);
        setIsSubmitting(false);
        return;
      }

      const postData: any = {
        userId: currentUser.uid,
        content: newPostContent,
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp()
      };
      if (newPostImage.trim()) {
        postData.imageUrl = newPostImage.trim();
      }
      await addDoc(collection(db, 'feedPosts'), postData);
      setNewPostContent('');
      setNewPostImage('');
    } catch (e) {
      const errInfo = {
        error: e instanceof Error ? e.message : String(e),
        operationType: 'create',
        path: 'feedPosts',
        authInfo: { userId: auth.currentUser?.uid }
      };
      console.error(JSON.stringify(errInfo));
      alert('Error posting to feed');
    }
    setIsSubmitting(false);
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      alert("Please log in to like.");
      return;
    }
    const isLiked = userLikes.has(postId);
    try {
      if (isLiked) {
         const q = query(collection(db, 'feedLikes'), where('postId', '==', postId), where('userId', '==', currentUser.uid));
         const snapshot = await getDocs(q);
         if (!snapshot.empty) {
            const likeDocId = snapshot.docs[0].id;
            await deleteDoc(doc(db, 'feedLikes', likeDocId));
            await updateDoc(doc(db, 'feedPosts', postId), {
               likesCount: increment(-1)
            });
         }
      } else {
         await addDoc(collection(db, 'feedLikes'), {
            postId: postId,
            userId: currentUser.uid,
            createdAt: serverTimestamp()
         });
         await updateDoc(doc(db, 'feedPosts', postId), {
            likesCount: increment(1)
         });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please log in to comment.");
      return;
    }
    if (!newComment.trim() || !selectedPost) return;

    setIsSubmitting(true);
    try {
      const moderation = await moderateContent(newComment);
      if (!moderation.isAllowed) {
        alert("Your comment couldn't be published because it violates community guidelines: " + moderation.reason);
        setIsSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'feedComments'), {
        postId: selectedPost.id,
        userId: currentUser.uid,
        content: newComment,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'feedPosts', selectedPost.id), {
        commentsCount: increment(1)
      });
      setNewComment('');
    } catch (e) {
      console.error('Error commenting', e);
    }
    setIsSubmitting(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      await deleteDoc(doc(db, 'feedPosts', postId));
    } catch(e) { console.error('Error deleting post'); }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await deleteDoc(doc(db, 'feedComments', commentId));
      await updateDoc(doc(db, 'feedPosts', postId), {
         commentsCount: increment(-1)
      });
    } catch(e) { console.error('Error deleting comment', e); }
  };

  return (
    <div className="bg-brand-light min-h-screen pb-20">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-12">
        <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-8 text-brand-dark">Community</h1>

        <div className="flex border-b-2 border-brand-dark/20 mb-8">
           <button 
             onClick={() => setFeedType('recent')}
             className={`flex-1 py-4 font-bold uppercase tracking-widest transition-colors ${feedType === 'recent' ? 'border-b-4 border-brand-accent text-brand-accent' : 'text-brand-dark/50 hover:text-brand-dark hover:bg-brand-dark/5'}`}
           >
             Recent
           </button>
           <button 
             onClick={() => setFeedType('popular')}
             className={`flex-1 py-4 font-bold uppercase tracking-widest transition-colors ${feedType === 'popular' ? 'border-b-4 border-brand-accent text-brand-accent' : 'text-brand-dark/50 hover:text-brand-dark hover:bg-brand-dark/5'}`}
           >
             For You
           </button>
        </div>

        {currentUser && (
          <form onSubmit={handlePost} className="bg-brand-light border-4 border-brand-dark shadow-[8px_8px_0_0_var(--brand-dark)] p-6 mb-12">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind? Discuss fashion, events, or share your work..."
              className="w-full bg-brand-muted border-2 border-brand-dark p-4 font-bold outline-none focus:bg-brand-light transition-colors resize-none mb-4 min-h-[100px]"
            />
            {newPostImage && (
              <div className="mb-4 relative w-48 h-48 border-4 border-brand-dark overflow-hidden bg-brand-muted shrink-0">
                <img src={newPostImage} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setNewPostImage('')} className="absolute top-2 right-2 bg-brand-light text-brand-dark border-2 border-brand-dark p-1 hover:text-red-500 hover:border-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            )}
            <div className="flex justify-between items-end">
              <label className="cursor-pointer bg-brand-light border-2 border-brand-dark text-brand-dark px-4 flex items-center h-12 font-bold uppercase tracking-widest text-xs hover:bg-brand-muted transition-colors">
                <span className="mr-2">+</span> Add Photo
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                     if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onloadend = () => setNewPostImage(reader.result as string);
                        reader.readAsDataURL(file);
                     }
                  }}
                  className="hidden" 
                />
              </label>
              <button 
                type="submit" 
                disabled={isSubmitting || (!newPostContent.trim() && !newPostImage.trim())}
                className="bg-brand-dark text-brand-light px-8 flex items-center h-12 font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors disabled:opacity-50 cursor-none"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        )}

        {posts.length === 0 ? (
          <div className="text-center p-20 border-4 border-brand-dark bg-brand-muted shadow-[8px_8px_0_0_var(--brand-dark)]">
            <p className="text-2xl font-bold uppercase tracking-widest text-brand-dark">No posts yet.</p>
          </div>
        ) : (
          <div className="flex flex-col shadow-[8px_8px_0_0_var(--brand-dark)]">
            {posts.map(post => (
              <motion.article 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                key={post.id} 
                className="bg-brand-light border-x-4 border-t-4 last:border-b-4 border-brand-dark p-6 sm:p-8"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-brand-dark overflow-hidden bg-brand-muted shrink-0 flex items-center justify-center text-xl font-bold text-brand-dark">
                       {authorsInfo[post.userId]?.avatarUrl ? (
                          <img src={authorsInfo[post.userId].avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                       ) : (
                          authorsInfo[post.userId]?.name?.charAt(0) || '?'
                       )}
                    </div>
                    <div>
                      <div className="font-bold text-brand-dark text-lg leading-tight flex items-center gap-2">
                        {authorsInfo[post.userId]?.name || 'Unknown User'}
                        {currentUser?.uid !== post.userId && (
                          <button className="text-xs text-brand-accent uppercase tracking-widest hover:underline">
                            Follow
                          </button>
                        )}
                      </div>
                      <div className="text-xs uppercase tracking-widest text-brand-dark/50">
                        {post.createdAt?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  {(currentUser?.uid === post.userId || isAdmin) && (
                    <button onClick={() => handleDeletePost(post.id)} className="text-brand-dark/50 hover:text-red-500 transition-colors p-2" title="Delete post">
                       <Trash2 size={20} />
                    </button>
                  )}
                </div>

                {post.content && <p className="text-lg font-bold text-brand-dark mb-6 whitespace-pre-wrap">{post.content}</p>}
                
                {post.imageUrl && (
                  <div className="mb-6 bg-brand-muted border-4 border-brand-dark overflow-hidden rounded-xl shadow-[8px_8px_0_0_var(--brand-dark)]">
                    <img src={post.imageUrl} alt="Post image" className="w-full max-h-[500px] object-cover" />
                  </div>
                )}

                <div className="flex items-center gap-8 pt-4 border-t-2 border-brand-dark/10 text-brand-dark">
                  <button 
                    onClick={() => handleLike(post.id)} 
                    className={`flex items-center gap-2 transition-colors hover:text-brand-accent ${userLikes.has(post.id) ? 'text-red-500' : ''}`}
                  >
                    <Heart size={24} fill={userLikes.has(post.id) ? "currentColor" : "none"} className="transition-transform active:scale-75" />
                    <span className="font-bold text-lg">{post.likesCount || 0}</span>
                  </button>
                  <button 
                    onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)} 
                    className={`flex items-center gap-2 hover:text-brand-accent transition-colors ${selectedPost?.id === post.id ? 'text-brand-accent' : ''}`}
                  >
                    <MessageCircle size={24} />
                    <span className="font-bold text-lg">{post.commentsCount || 0}</span>
                  </button>
                </div>

                {selectedPost?.id === post.id && (
                  <div className="mt-8 border-t-2 border-brand-dark pt-8">
                    <h4 className="font-bold uppercase tracking-widest text-brand-dark mb-6 text-sm">Comments</h4>
                    {comments.map(comment => (
                      <div key={comment.id} className="mb-4 bg-brand-light p-4 border-2 border-brand-dark shadow-[4px_4px_0_0_var(--brand-dark)]">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-bold text-xs uppercase tracking-widest text-brand-dark/70">{authorsInfo[comment.userId]?.name || 'Unknown User'}</div>
                          {(currentUser?.uid === comment.userId || isAdmin) && (
                            <button onClick={() => handleDeleteComment(comment.id, post.id)} className="text-brand-dark/50 hover:text-red-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <p className="font-bold text-brand-dark text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    ))}
                    {currentUser && (
                      <form onSubmit={handleComment} className="flex gap-4 mt-6">
                        <input 
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1 bg-brand-light border-2 border-brand-dark p-3 font-bold outline-none focus:bg-brand-muted transition-colors"
                        />
                        <button type="submit" disabled={isSubmitting || !newComment.trim()} className="bg-brand-dark text-brand-light px-6 py-3 hover:bg-brand-accent transition-colors disabled:opacity-50 font-bold uppercase tracking-widest">
                          <Send size={20} />
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
