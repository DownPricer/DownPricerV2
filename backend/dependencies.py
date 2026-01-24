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
    """
    async def s_tier_checker(current_user: TokenData = Depends(get_current_user)):
        # Rôles S-tier autorisés
        s_tier_roles = [
            UserRole.S_PLAN_5,
            UserRole.S_PLAN_10,
            UserRole.S_PLAN_15,
            UserRole.SITE_PLAN_10  # Legacy, toléré pour backward compatibility
        ]
        
        # Convertir les rôles string en UserRole (avec gestion d'erreur pour rôles non définis)
        user_roles = []
        for role_str in current_user.roles:
            try:
                user_roles.append(UserRole(role_str))
            except ValueError:
                # Rôle non défini dans l'Enum, ignorer
                continue
        
        # Vérifier si l'utilisateur a au moins un rôle S-tier
        if not any(role in user_roles for role in s_tier_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès interdit : module Pro réservé aux utilisateurs S-tier (S_PLAN_5, S_PLAN_10, S_PLAN_15)"
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
