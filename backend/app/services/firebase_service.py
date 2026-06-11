import firebase_admin
from firebase_admin import credentials, firestore
import os

class FirebaseService:
    def __init__(self):
        self.db = None
        self._initialize()

    def _initialize(self):
        # Look for credentials file via env var, else use fallback
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", None)
        try:
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                print("Firebase Admin initialized securely.")
            else:
                print("[Firebase] WARNING: FIREBASE_CREDENTIALS_PATH not set — using offline fallback (data will not be persisted).")
                self.db = FallbackFirestore()
        except Exception as e:
            print(f"[Firebase] Initialization error: {e}. Using offline fallback.")
            self.db = FallbackFirestore()
        # No fake admin created; UI will fetch actual admin via auth

    def add_notification(self, event_type: str, payload: dict):
        """Store a notification event in Firestore collection 'notifications'."""
        if not self.db:
            print("[Firebase] No DB to store notification")
            return
        try:
            doc_ref = self.db.collection('notifications').document()
            doc_ref.set({
                'type': event_type,
                'payload': payload,
                'timestamp': firestore.SERVER_TIMESTAMP
            })
            print(f'[Firebase] Notification stored: {event_type}')
        except Exception as e:
            print(f'[Firebase] Failed to store notification: {e}')

    def add_contact_message(self, name: str, email: str, message: str):
        """Store a contact form message in Firestore collection 'messages'."""
        if not self.db:
            print('[Firebase] No DB available to store contact message')
            return
        try:
            doc_ref = self.db.collection('messages').document()
            doc_ref.set({
                'name': name,
                'email': email,
                'message': message,
                'timestamp': firestore.SERVER_TIMESTAMP
            })
            print('[Firebase] Contact message stored')
        except Exception as e:
            print(f'[Firebase] Failed to store contact message: {e}')

    def update_occupancy(self, stats, vehicles, camera_id="default"):
        """Pushes latest stats to Firestore."""
        if self.db:
            try:
                self.db.collection('analytics').document(camera_id).set({
                    "statistics": stats,
                    "vehicles": vehicles,
                    "timestamp": firestore.SERVER_TIMESTAMP
                })
            except Exception as e:
                print(f"Failed to push to Firebase: {e}")

# Fallback classes for offline mode
class FallbackFirestore:
    """In-memory fallback used when Firebase credentials are not configured."""
    def collection(self, name):
        return FallbackCollection(name)

class FallbackCollection:
    def __init__(self, name):
        self.name = name
    def document(self, doc_id=None):
        return FallbackDocument(doc_id)

class FallbackDocument:
    def __init__(self, doc_id):
        self.doc_id = doc_id
    def set(self, data):
        # Offline fallback — data not persisted
        pass

firebase_service = FirebaseService()
