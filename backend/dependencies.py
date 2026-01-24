from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth import decode_access_token
from models import TokenData, UserRole
from typing import List

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré"
        )
    
    email = payload.get("sub")
    roles = payload.get("roles", [])
    
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide"
        )
    
    return TokenData(email=email, roles=roles)

def require_roles(required_roles: List[UserRole]):
    async def role_checker(current_user: TokenData = Depends(get_current_user)):
        user_roles = [UserRole(role) for role in current_user.roles]
        
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès interdit : rôle insuffisant"
            )
        
        return current_user
    
    return role_checker

def require_s_tier():
    """
    Middleware pour vérifier l'accès S-tier (S_PLAN_5, S_PLAN_10, S_PLAN_15, SITE_PLAN_10 legacy).
    Utilisé pour le module Pro achat/revente.
    Autorise aussi ADMIN pour l'accès complet.
    """
    async def s_tier_checker(current_user: TokenData = Depends(get_current_user)):
        # Rôles S-tier autorisés (en string pour comparaison robuste)
        s_tier_role_strings = [
            "S_PLAN_5",
            "S_PLAN_10",
            "S_PLAN_15",
            "SITE_PLAN_10",  # Legacy, toléré pour backward compatibility
            "ADMIN"  # Admin a accès complet
        ]
        
        # Extraire les rôles de différentes façons possibles
        # current_user.roles peut être une liste, un string, ou un champ "role" peut exister
        roles_to_check = []
        
        # Méthode 1: current_user.roles (liste ou string)
        if hasattr(current_user, 'roles'):
            roles_attr = current_user.roles
            if isinstance(roles_attr, list):
                roles_to_check.extend(roles_attr)
            elif roles_attr:
                roles_to_check.append(roles_attr)
        
        # Méthode 2: current_user.role (singulier, si existe)
        if hasattr(current_user, 'role') and current_user.role:
            roles_to_check.append(current_user.role)
        
        # Convertir tous les rôles en string pour comparaison
        user_role_strings = []
        for role in roles_to_check:
            if isinstance(role, UserRole):
                user_role_strings.append(role.value)
            elif isinstance(role, str):
                user_role_strings.append(role.upper())  # Normaliser en majuscules
            else:
                # Essayer de convertir en string
                role_str = str(role).upper()
                user_role_strings.append(role_str)
        
        # Normaliser aussi les rôles autorisés en majuscules pour comparaison
        s_tier_normalized = [r.upper() for r in s_tier_role_strings]
        user_role_strings_normalized = [r.upper() for r in user_role_strings]
        
        # Vérifier si l'utilisateur a au moins un rôle autorisé
        has_access = any(role_str in s_tier_normalized for role_str in user_role_strings_normalized)
        
        if not has_access:
            # Message de debug avec les rôles lus
            roles_debug = ", ".join(user_role_strings) if user_role_strings else "aucun rôle trouvé"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Accès interdit : module Pro réservé aux utilisateurs S-tier (S_PLAN_5, S_PLAN_10, S_PLAN_15) ou ADMIN. Rôles détectés: {roles_debug}"
            )
        
        return current_user
    
    return s_tier_checker

def require_admin():
    """
    Middleware pour vérifier l'accès admin (ADMIN role).
    Utilisé pour les endpoints admin du module Pro.
    """
    async def admin_checker(current_user: TokenData = Depends(get_current_user)):
        user_roles = []
        for role_str in current_user.roles:
            try:
                user_roles.append(UserRole(role_str))
            except ValueError:
                continue
        
        if UserRole.ADMIN not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès interdit : rôle administrateur requis"
            )
        
        return current_user
    
    return admin_checker
