"""
Script pour créer un compte administrateur
Usage: python create_admin.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from auth import get_password_hash
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def create_admin():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    if not mongo_url or not db_name:
        print("❌ Erreur: MONGO_URL et DB_NAME doivent être définis dans backend/.env")
        return
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("=== Création d'un compte administrateur ===\n")
    
    email = input("Email de l'admin: ").strip()
    if not email:
        print("❌ L'email est requis")
        client.close()
        return
    
    password = input("Mot de passe: ").strip()
    if not password:
        print("❌ Le mot de passe est requis")
        client.close()
        return
    
    first_name = input("Prénom (optionnel): ").strip() or "Admin"
    last_name = input("Nom (optionnel): ").strip() or "User"
    
    # Vérifier si l'utilisateur existe déjà
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        print(f"\n⚠️  L'utilisateur {email} existe déjà.")
        response = input("Voulez-vous lui ajouter le rôle ADMIN? (o/n): ").strip().lower()
        if response == 'o':
            roles = existing.get("roles", [])
            if "ADMIN" not in roles:
                roles.append("ADMIN")
                await db.users.update_one(
                    {"email": email},
                    {"$set": {"roles": roles}}
                )
                print(f"✅ Rôle ADMIN ajouté avec succès à {email}!")
            else:
                print(f"ℹ️  L'utilisateur {email} a déjà le rôle ADMIN.")
        client.close()
        return
    
    # Créer le nouvel utilisateur admin
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": get_password_hash(password),
        "first_name": first_name,
        "last_name": last_name,
        "roles": ["ADMIN", "CLIENT"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    print(f"\n✅ Admin créé avec succès!")
    print(f"   Email: {email}")
    print(f"   Rôles: {user_doc['roles']}")
    print(f"\n💡 Vous pouvez maintenant vous connecter avec ces identifiants.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())

