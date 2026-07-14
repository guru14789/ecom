import admin from 'firebase-admin';
import { db } from './client';
import { AppError } from '../../utils/errors';

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderRole: 'buyer' | 'vendor';
  text: string;
  createdAt: admin.firestore.Timestamp | FirebaseFirestore.Timestamp;
}

export interface ChatSession {
  id?: string;
  buyerId: string;
  vendorId: string;
  buyerName: string;
  vendorName: string;
  lastMessage: string;
  lastMessageTime: admin.firestore.Timestamp | FirebaseFirestore.Timestamp;
  unreadCountVendor: number;
  unreadCountBuyer: number;
  createdAt: admin.firestore.Timestamp | FirebaseFirestore.Timestamp;
  updatedAt: admin.firestore.Timestamp | FirebaseFirestore.Timestamp;
}

export const getOrCreateChat = async (buyerId: string, vendorId: string, buyerName: string, vendorName: string) => {
  const chatsRef = db.collection('chats');
  
  // Check if chat already exists
  const snapshot = await chatsRef
    .where('buyerId', '==', buyerId)
    .where('vendorId', '==', vendorId)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ChatSession;
  }

  // Create new chat
  const newChat: Omit<ChatSession, 'id'> = {
    buyerId,
    vendorId,
    buyerName,
    vendorName,
    lastMessage: 'Chat initiated',
    lastMessageTime: admin.firestore.FieldValue.serverTimestamp() as any,
    unreadCountVendor: 0,
    unreadCountBuyer: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp() as any,
    updatedAt: admin.firestore.FieldValue.serverTimestamp() as any,
  };

  const docRef = await chatsRef.add(newChat);
  const chatData = await docRef.get();
  return { id: docRef.id, ...chatData.data() } as ChatSession;
};

export const sendMessage = async (chatId: string, senderId: string, senderRole: 'buyer' | 'vendor', text: string) => {
  const chatRef = db.collection('chats').doc(chatId);
  const messagesRef = chatRef.collection('messages');

  const chatDoc = await chatRef.get();
  if (!chatDoc.exists) throw new AppError('NOT_FOUND', 'Chat not found', 404);

  const message: Omit<ChatMessage, 'id'> = {
    senderId,
    senderRole,
    text,
    createdAt: admin.firestore.FieldValue.serverTimestamp() as any,
  };

  await messagesRef.add(message);

  // Update last message and unread counts
  const updateData: any = {
    lastMessage: text,
    lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (senderRole === 'buyer') {
    updateData.unreadCountVendor = admin.firestore.FieldValue.increment(1);
  } else {
    updateData.unreadCountBuyer = admin.firestore.FieldValue.increment(1);
  }

  await chatRef.update(updateData);
  return { success: true };
};

export const getChatsForUser = async (userId: string, role: 'buyer' | 'vendor') => {
  const chatsRef = db.collection('chats');
  const field = role === 'buyer' ? 'buyerId' : 'vendorId';
  
  const snapshot = await chatsRef.where(field, '==', userId).get();
  const chats = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ChatSession[];
  
  return chats.sort((a, b) => {
    const aTime = (a.updatedAt as any)?.toMillis ? (a.updatedAt as any).toMillis() : 0;
    const bTime = (b.updatedAt as any)?.toMillis ? (b.updatedAt as any).toMillis() : 0;
    return bTime - aTime;
  });
};

export const markChatRead = async (chatId: string, role: 'buyer' | 'vendor') => {
  const chatRef = db.collection('chats').doc(chatId);
  const updateField = role === 'buyer' ? 'unreadCountBuyer' : 'unreadCountVendor';
  await chatRef.update({ [updateField]: 0 });
};
