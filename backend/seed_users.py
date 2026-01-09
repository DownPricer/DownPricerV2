"""
Script non-interactif pour créer des comptes de test (admin, vendeur, client)
Usage: python seed_users.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from auth import get_password_hash
import os
from datetime import datetime, timezone
import uuid

# Configuration des comptes de test
TEST_USERS = [
    {
        "email": "admin@downpricer.com",
        "password": "admin123",
        "first_name": "Admin",
        "last_name": "User",
        "roles": ["ADMIN", "CLIENT"]
    },
    {
        "email": "vendeur@downpricer.com",
        "password": "vendeur123",
        "first_name": "Vendeur",
        "last_name": "Test",
        "roles": ["SELLER", "CLIENT"]
    },
    {
        "email": "test@downpricer.com",
        "password": "test123",
        "first_name": "Client",
        "last_name": "Test",
        "roles": ["CLIENT"]
    }
]

async def seed_users():
    # Récupérer les variables d'environnement (depuis Docker ou .env)
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://mongo:27017')
    db_name = os.environ.get('DB_NAME', 'downpricer')
    
    print("=== Création des comptes de test ===\n")
    print(f"MongoDB URL: {mongo_url}")
    print(f"Database: {db_name}\n")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    created_count = 0
    updated_count = 0
    skipped_count = 0
    
    for user_data in TEST_USERS:
        email = user_data["email"]
        
        # Vérifier si l'utilisateur existe déjà
        existing = await db.users.find_one({"email": email})
        
        if existing:
            # Mettre à jour le mot de passe et les rôles si nécessaire
            password_hash = get_password_hash(user_data["password"])
            roles = user_data["roles"]
            
            await db.users.update_one(
                {"email": email},
                {
                    "$set": {
                        "password_hash": password_hash,
                        "roles": roles,
                        "first_name": user_data["first_name"],
                        "last_name": user_data["last_name"]
                    }
                }
            )
            
            print(f"✅ Mis à jour: {email} (rôles: {', '.join(roles)})")
            updated_count += 1
        else:
            # Créer le nouvel utilisateur
            user_id = str(uuid.uuid4())
            user_doc = {
                "id": user_id,
                "email": email,
                "password_hash": get_password_hash(user_data["password"]),
                "first_name": user_data["first_name"],
                "last_name": user_data["last_name"],
                "roles": user_data["roles"],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.users.insert_one(user_doc)
            print(f"✅ Créé: {email} (rôles: {', '.join(user_data['roles'])})")
            created_count += 1
    
    client.close()
    
    print(f"\n=== Résumé ===")
    print(f"✅ Créés: {created_count}")
    print(f"🔄 Mis à jour: {updated_count}")
    print(f"\n💡 Comptes de test disponibles:")
    print(f"   Admin:  admin@downpricer.com / admin123")
    print(f"   Vendeur: vendeur@downpricer.com / vendeur123")
    print(f"   Client:  test@downpricer.com / test123")

if __name__ == "__main__":
    asyncio.run(seed_users())

