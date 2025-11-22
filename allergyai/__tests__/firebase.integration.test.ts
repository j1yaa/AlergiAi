
import { auth, db } from '../src/config/firebase';
import {
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    deleteUser
} from 'firebase/auth';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    query,
    where,
    orderBy,
    limit
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Firebase Integration Tests', () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    let testUserId: string;

    beforeAll(async () => {
        await AsyncStorage.clear();
    });

    afterAll(async () => {
        if (auth.currentUser) {
            try {
                await deleteUser(auth.currentUser);
            } catch (error) {
                console.log('User cleanup skipped:', error);
            }
        }
        await signOut(auth);
    });

    describe('Firebase Authentication', () => {
        test('should initialize Firebase Auth', () => {
            expect(auth).toBeDefined();
            expect(auth.app).toBeDefined();
        });

        test('should create user with email and password', async () => {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                testEmail,
                testPassword
            );

            expect(userCredential.user).toBeDefined();
            expect(userCredential.user.email).toBe(testEmail);
            expect(userCredential.user.uid).toBeDefined();

            testUserId = userCredential.user.uid;
        }, 15000);

        test('should sign in with email and password', async () => {
            await signOut(auth);

            const userCredential = await signInWithEmailAndPassword(
                auth,
                testEmail,
                testPassword
            );

            expect(userCredential.user).toBeDefined();
            expect(userCredential.user.email).toBe(testEmail);
            expect(auth.currentUser).toBeDefined();
        }, 15000);

        test('should have current user after sign in', () => {
            expect(auth.currentUser).not.toBeNull();
            expect(auth.currentUser?.email).toBe(testEmail);
        });
    });

    describe('Firestore Operations', () => {
        test('should initialize Firestore', () => {
            expect(db).toBeDefined();
        });

        test('should add document to collection', async () => {
            const testData = {
                userId: testUserId,
                name: 'Test Meal',
                ingredients: ['ingredient1', 'ingredient2'],
                timestamp: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, 'test'), testData);

            expect(docRef.id).toBeDefined();
            expect(typeof docRef.id).toBe('string');
        }, 10000);

        test('should read documents from collection', async () => {
            const querySnapshot = await getDocs(collection(db, 'test'));

            expect(querySnapshot).toBeDefined();
            expect(querySnapshot.size).toBeGreaterThan(0);

            querySnapshot.forEach(doc => {
                expect(doc.id).toBeDefined();
                expect(doc.data()).toBeDefined();
            });
        }, 10000);

        test('should query documents with where clause', async () => {
            const q = query(
                collection(db, 'test'),
                where('userId', '==', testUserId)
            );

            const querySnapshot = await getDocs(q);

            expect(querySnapshot.empty).toBe(false);
            querySnapshot.forEach(doc => {
                expect(doc.data().userId).toBe(testUserId);
            });
        }, 10000);

        test('should update document', async () => {
            const q = query(
                collection(db, 'test'),
                where('userId', '==', testUserId),
                limit(1)
            );

            const querySnapshot = await getDocs(q);
            const docToUpdate = querySnapshot.docs[0];

            await updateDoc(docToUpdate.ref, {
                updated: true,
                updatedAt: new Date().toISOString()
            });

            const updatedDoc = await getDocs(
                query(collection(db, 'test'), where('__name__', '==', docToUpdate.id))
            );

            expect(updatedDoc.docs[0].data().updated).toBe(true);
        }, 10000);

        test('should delete document', async () => {
            const q = query(
                collection(db, 'test'),
                where('userId', '==', testUserId),
                limit(1)
            );

            const querySnapshot = await getDocs(q);
            const docToDelete = querySnapshot.docs[0];
            const docId = docToDelete.id;

            await deleteDoc(doc(db, 'test', docId));

            const deletedCheck = await getDocs(
                query(collection(db, 'test'), where('__name__', '==', docId))
            );

            expect(deletedCheck.empty).toBe(true);
        }, 10000);

        test('should handle complex queries with orderBy', async () => {
            // Add multiple test documents
            const testDocs = [
                { userId: testUserId, name: 'Meal A', priority: 1, timestamp: new Date().toISOString() },
                { userId: testUserId, name: 'Meal B', priority: 2, timestamp: new Date().toISOString() },
                { userId: testUserId, name: 'Meal C', priority: 3, timestamp: new Date().toISOString() }
            ];

            for (const testDoc of testDocs) {
                await addDoc(collection(db, 'test'), testDoc);
            }

            const q = query(
                collection(db, 'test'),
                where('userId', '==', testUserId),
                orderBy('priority', 'desc'),
                limit(2)
            );

            const querySnapshot = await getDocs(q);

            expect(querySnapshot.size).toBeLessThanOrEqual(2);

            const priorities = querySnapshot.docs.map(doc => doc.data().priority);
            expect(priorities[0]).toBeGreaterThanOrEqual(priorities[1] || 0);
        }, 15000);
    });

    describe('AsyncStorage Persistence', () => {
        test('should persist auth state in AsyncStorage', async () => {
            const keys = await AsyncStorage.getAllKeys();

            expect(keys.length).toBeGreaterThan(0);

            const authKeys = keys.filter(key =>
                key.includes('firebase') || key.includes('auth')
            );

            expect(authKeys.length).toBeGreaterThan(0);
        });

        test('should retrieve stored data', async () => {
            await AsyncStorage.setItem('test-key', 'test-value');

            const value = await AsyncStorage.getItem('test-key');

            expect(value).toBe('test-value');

            await AsyncStorage.removeItem('test-key');
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid login credentials', async () => {
            await expect(
                signInWithEmailAndPassword(auth, 'invalid@example.com', 'wrongpassword')
            ).rejects.toThrow();
        });

        test('should handle duplicate user creation', async () => {
            await expect(
                createUserWithEmailAndPassword(auth, testEmail, testPassword)
            ).rejects.toThrow();
        });

        test('should handle missing document', async () => {
            const nonExistentDoc = doc(db, 'test', 'non-existent-id');

            await expect(
                updateDoc(nonExistentDoc, { test: 'value' })
            ).rejects.toThrow();
        });
    });

    describe('Cleanup', () => {
        test('should clean up test documents', async () => {
            const q = query(
                collection(db, 'test'),
                where('userId', '==', testUserId)
            );

            const querySnapshot = await getDocs(q);

            const deletePromises = querySnapshot.docs.map(doc =>
                deleteDoc(doc.ref)
            );

            await Promise.all(deletePromises);

            const verifySnapshot = await getDocs(q);
            expect(verifySnapshot.empty).toBe(true);
        }, 15000);

        test('should sign out user', async () => {
            await signOut(auth);

            expect(auth.currentUser).toBeNull();
        });
    });
});