"""
Script de migration pour corriger les rôles legacy SITE_PLAN_10 et SITE_PLAN_15
Remplace SITE_PLAN_10 par SITE_PLAN_2 et SITE_PLAN_15 par SITE_PLAN_3
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# Charger les variables d'environnement
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'downpricer')

if not MONGO_URL:
    print("❌ MONGO_URL n'est pas défini dans backend/.env")
    sys.exit(1)

async def migrate_legacy_plan_roles():
    """Migre les rôles legacy vers les nouveaux rôles"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔄 Démarrage de la migration des rôles legacy...")
    
    # Migration pour les arrays (roles est un array)
    # Remplacer SITE_PLAN_10 par SITE_PLAN_2 dans les arrays
    users_with_10 = await db.users.find({"roles": {"$in": ["SITE_PLAN_10"]}}).to_list(None)
    count_10_array = 0
    for user in users_with_10:
        if isinstance(user.get("roles"), list):
            if "SITE_PLAN_10" in user["roles"]:
                user["roles"] = [r if r != "SITE_PLAN_10" else "SITE_PLAN_2" for r in user["roles"]]
                await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {"roles": user["roles"]}}
                )
                count_10_array += 1
    
    print(f"✅ Migré {count_10_array} utilisateur(s) avec SITE_PLAN_10 dans array vers SITE_PLAN_2")
    
    # Remplacer SITE_PLAN_15 par SITE_PLAN_3 dans les arrays
    users_with_15 = await db.users.find({"roles": {"$in": ["SITE_PLAN_15"]}}).to_list(None)
    count_15_array = 0
    for user in users_with_15:
        if isinstance(user.get("roles"), list):
            if "SITE_PLAN_15" in user["roles"]:
                user["roles"] = [r if r != "SITE_PLAN_15" else "SITE_PLAN_3" for r in user["roles"]]
                await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {"roles": user["roles"]}}
                )
                count_15_array += 1
    
    print(f"✅ Migré {count_15_array} utilisateur(s) avec SITE_PLAN_15 dans array vers SITE_PLAN_3")
    
    # Mettre à jour site_plan si présent
    result_site_plan_10 = await db.users.update_many(
        {"site_plan": "SITE_PLAN_10"},
        {"$set": {"site_plan": "SITE_PLAN_2"}}
    )
    print(f"✅ Migré {result_site_plan_10.modified_count} utilisateur(s) avec site_plan=SITE_PLAN_10 vers SITE_PLAN_2")
    
    result_site_plan_15 = await db.users.update_many(
        {"site_plan": "SITE_PLAN_15"},
        {"$set": {"site_plan": "SITE_PLAN_3"}}
    )
    print(f"✅ Migré {result_site_plan_15.modified_count} utilisateur(s) avec site_plan=SITE_PLAN_15 vers SITE_PLAN_3")
    
    print("\n✅ Migration terminée !")
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_legacy_plan_roles())
